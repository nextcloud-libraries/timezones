#!/usr/bin/python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# SPDX-FileCopyrightText: 2015-2021 Mozilla Thunderbird authors
# SPDX-FileCopyrightText: 2021-2024 Nextcloud GmbH and Nextcloud contributors
# SPDX-License-Identifier: MPL-2.0

"""
This script allows updating Calendar's zones.json.
  python update-zones.py --vzic /path/to/tzurl/vzic --tzdata /path/to/latest/tzdata

You can also have the latest tzdata downloaded automatically:
  python update-zones.py --vzic /path/to/tzurl/vzic

------------------------

Info for use in the @nextcloud/timezones library:

RUN:
- Download and build vzic (https://github.com/libical/vzic/)
    - git clone https://github.com/libical/vzic.git
    - cd vzic && make
- Run with Python 3
    - python3 update-zones.py --vzic /PATH/TO/VZIC/EXECUTABLE

INFO:
- Modernized code to Python 3
- Do no use vzic's pure timezones for now as ical.js can't parse them (BYYEARDAY + BYDAY)
- Removed all code specific to Mozilla's stuff
- Remove code to make time zones from vzic compatible with Outlook (this is already implemented in
  vzic by omitting the --pure flag)
- Remove custom cutoff filters (HISTORY_CUTOFF and FUTURE_CUTOFF)
"""

import argparse
import ftplib
import json
import os
import os.path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from collections import OrderedDict
from datetime import date, timedelta

# Keep timezone changes from this date onwards. If the zones.json file is becoming
# too large, consider changing to a later date.
# HISTORY_CUTOFF = 20200101
# FUTURE_CUTOFF = 20301231


class TimezoneUpdater(object):
    """Timezone updater class, use the run method to do everything automatically"""

    def __init__(self, tzdata_path, zoneinfo_pure_path):
        self.tzdata_path = tzdata_path
        self.zoneinfo_pure_path = zoneinfo_pure_path

    def download_tzdata(self):
        """Download the latest tzdata from ftp.iana.org"""
        tzdata_download_path = tempfile.mktemp(".tar.gz", prefix="zones")
        sys.stderr.write(
            "Downloading tzdata-latest.tar.gz from"
            " ftp.iana.org to %s\n" % tzdata_download_path
        )
        ftp = ftplib.FTP("ftp.iana.org")
        ftp.login()
        ftp.retrbinary(
            "RETR /tz/tzdata-latest.tar.gz", open(tzdata_download_path, "wb").write
        )
        ftp.quit()

        self.tzdata_path = tempfile.mkdtemp(prefix="zones")
        sys.stderr.write(
            "Extracting %s to %s\n" % (tzdata_download_path, self.tzdata_path)
        )
        tarfile.open(tzdata_download_path).extractall(path=self.tzdata_path)
        os.unlink(tzdata_download_path)

    def get_tzdata_version(self):
        """Extract version number of tzdata files."""
        version = None
        with open(os.path.join(self.tzdata_path, "version"), "r") as versionfile:
            for line in versionfile:
                match = re.match(r"\w+", line)
                if match is not None:
                    version = "2." + match.group(0)
                    break
        return version

    def run_vzic(self, vzic_path):
        """Use vzic to create ICS versions of the data."""

        # Use `vzic` to create zone files.
        sys.stderr.write("Exporting pure zone info to %s\n" % self.zoneinfo_pure_path)
        subprocess.check_call(
            [
                vzic_path,
                "--olson-dir",
                self.tzdata_path,
                "--output-dir",
                self.zoneinfo_pure_path,
                # "--pure",
            ],
            stdout=sys.stderr,
        )

    def read_backward(self):
        """Read the 'backward' file, which contains timezone identifier links"""
        links = {}
        with open(os.path.join(self.tzdata_path, "backward"), "r") as backward:
            for line in backward:
                parts = line.strip().split()
                if len(parts) == 3 and parts[0] == "Link":
                    _, tgt, src = parts
                    links[src] = tgt
        return links

    def read_ics(self, filename):
        """Read a single zone's ICS files."""
        with open(os.path.join(self.zoneinfo_pure_path, filename), "r") as zone:
            zoneinfo_pure = zone.readlines()

        # Loop through the lines of the file, splitting it into components.
        components = []
        current_component = None
        for i in range(0, len(zoneinfo_pure)):
            line = zoneinfo_pure[i].rstrip()
            [key, value] = line.split(":", 1)

            if line in ["BEGIN:STANDARD", "BEGIN:DAYLIGHT"]:
                current_component = {
                    "line": i,
                    "type": value,
                    "props": OrderedDict(),
                }

            elif line in ["END:STANDARD", "END:DAYLIGHT"]:
                components.append(current_component)
                current_component = None

            elif current_component:
                current_component["props"][key] = value

        zone_name = filename[:-4]
        ics = []
        for component in components:
            ics_lines = []
            ics_lines.append("BEGIN:%s" % component["type"])

            for key, value in component["props"].items():
                ics_lines.append(f"{key}:{value}")

            ics_lines.append("END:%s" % component["type"])
            ics.append("\r\n".join(ics_lines))

        return {
            "ics": ics,
        }

    def read_dir(self, path, process_zone, prefix=""):
        """Recursively read a directory for ICS files.
        Files could be two or three levels deep."""

        zones = {}
        for entry in os.listdir(path):
            if entry == "Etc":
                continue
            fullpath = os.path.join(path, entry)
            if os.path.isdir(fullpath):
                zones.update(
                    self.read_dir(fullpath, process_zone, os.path.join(prefix, entry))
                )
            elif prefix != "":
                filename = os.path.join(prefix, entry)
                zones[filename[:-4]] = process_zone(filename)
        return zones

    @staticmethod
    def migrate_aliases(aliases):
        """Migrate aliases from old (tzid: {"aliasTo": alias}) to new format (tzid: alias)"""
        newaliases = {}
        for key, value in aliases.items():
            if type(value) is dict:
                newaliases[key] = value["aliasTo"]
            else:
                newaliases[key] = value
        return newaliases

    @staticmethod
    def link_removed_zones(oldzones, newzones, links):
        """Checks which zones have been removed and creates an alias entry if there is one"""
        aliases = {}
        for key in oldzones:
            if key not in newzones and key in links:
                sys.stderr.write("Linking %s to %s\n" % (key, links[key]))
                aliases[key] = links[key]
        return aliases

    @staticmethod
    def write_output(version, aliases, zones, filename):
        """Write the data to zones.json."""
        data = OrderedDict()
        data["version"] = version
        data["aliases"] = OrderedDict(sorted(aliases.items()))
        data["zones"] = OrderedDict(sorted(zones.items()))

        with open(filename, "w") as jsonfile:
            json.dump(data, jsonfile, indent=2, separators=(",", ": "))
            jsonfile.write("\n")

    def run(self, zones_json_file, vzic_path, force = False):
        """Run the timezone updater, with a zones.json file and the path to vzic"""

        need_download_tzdata = self.tzdata_path is None
        if need_download_tzdata:
            self.download_tzdata()

        with open(zones_json_file, "r") as jsonfile:
            zonesjson = json.load(jsonfile)

        version = self.get_tzdata_version()
        if version == zonesjson["version"] and not force:
            sys.stderr.write("zones.json is already up to date (%s)\n" % version)
            return
        else:
            sys.stderr.write("You are using tzdata %s\n" % version[2:])

        links = self.read_backward()

        self.run_vzic(vzic_path)

        newzones = self.read_dir(
            self.zoneinfo_pure_path, lambda fn: self.read_ics(fn)
        )

        zonesjson["aliases"] = self.migrate_aliases(zonesjson["aliases"])
        newaliases = self.link_removed_zones(zonesjson["zones"], newzones, links)
        zonesjson["aliases"].update(newaliases)

        self.write_output(version, zonesjson["aliases"], newzones, zones_json_file)

        if need_download_tzdata:
            shutil.rmtree(self.tzdata_path)


def parse_args():
    """Gather arguments from the command-line."""
    parser = argparse.ArgumentParser(
        description="Create timezone info JSON file from tzdata files"
    )
    parser.add_argument(
        "-v",
        "--vzic",
        dest="vzic_path",
        required=True,
        help="""Path to the `vzic` executable. This must be
                        downloaded from https://code.google.com/p/tzurl/ and
                        compiled.""",
    )
    parser.add_argument(
        "-t",
        "--tzdata",
        dest="tzdata_path",
        help="""Path to a directory containing the IANA
                        timezone data.  If this argument is omitted, the data
                        will be downloaded from ftp.iana.org.""",
    )
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Force updating zones.json even if the versions match",
    )
    return parser.parse_args()


def main():
    """Run the timezone updater from command-line args"""
    args = parse_args()
    json_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), "zones.json")

    zoneinfo_pure_path = tempfile.mkdtemp(prefix="zones")

    updater = TimezoneUpdater(args.tzdata_path, zoneinfo_pure_path)
    updater.run(json_file, args.vzic_path, args.force)

    # Clean up.
    shutil.rmtree(zoneinfo_pure_path)


if __name__ == "__main__":
    main()
