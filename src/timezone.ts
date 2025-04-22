/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'

export class Timezone {

	/**
	 * Id of the timezone.
	 */
	private _timezoneId?: string

	/**
	 * ICS representation of the timezone
	 */
	private _ics?: string

	private _timezone?: ICAL.Timezone

	private _initialized: boolean

	/**
	 * Constructor
	 *
	 * @param timezoneId - Id of the timezone
	 * @param ics - The iCalendar timezone definition
	 */
	constructor(timezoneId: string, ics: string)
	constructor(timezoneId: ICAL.Timezone | ICAL.Component)
	constructor(timezoneId: string | ICAL.Timezone | ICAL.Component, ics?: string) {
		// If the first parameter is already
		// an instance of ICAL.Timezone,
		// skip lazy loading
		if (timezoneId instanceof ICAL.Timezone) {
			this._timezone = timezoneId
			this._initialized = true
		} else if (timezoneId instanceof ICAL.Component) {
			this._timezone = new ICAL.Timezone(timezoneId)
			this._initialized = true
		} else {
			this._timezoneId = timezoneId
			this._ics = ics!
			this._initialized = false
		}
	}

	/**
	 * Get the timezone id
	 */
	get timezoneId(): string {
		if (this._initialized) {
			return this._timezone!.tzid
		}

		// it is defined as in the constructor the only why `initialized` is not set is when timezone is a string.
		return this._timezoneId!
	}

	/**
	 * Get the UTC Offset for a given date in this timezone.
	 *
	 * @param year - Year of the date
	 * @param month - Month of the date (1-based)
	 * @param day - Day of the date
	 * @param hour - Hour of the date
	 * @param minute - Minute of the date
	 * @param second - Second of the date
	 */
	offsetForArray(year: number, month: number, day?: number, hour?: number, minute?: number, second?: number): number {
		/// @ts-expect-error Wrong typings the timezone parameter is optional
		const time = new ICAL.Time({
			year,
			month,
			day,
			hour,
			minute,
			second,
			isDate: false,
		})
		return this.timezone.utcOffset(time)
	}

	/**
	 * Converts a timestamp to an array of year, month, day, hour, minute, second.
	 *
	 * @param {number} ms Timestamp in milliseconds
	 * @return {number[]}
	 */
	timestampToArray(ms: number): number[] {
		// just create a dummy object because fromUnixTime is not exposed on ICAL.Time
		const time = ICAL.Time.fromData({
			year: 1970,
			month: 1,
			day: 1,
			hour: 0,
			minute: 0,
			second: 0,
		})
		time.fromUnixTime(Math.floor(ms / 1000))

		const local = time.convertToZone(this.timezone)
		return [
			local.year,
			local.month, // THIS is 1-based !
			local.day,
			local.hour,
			local.minute,
			local.second,
		]
	}

	toICALTimezone(): ICAL.Timezone {
		return this.timezone
	}

	/**
	 * Returns the corresponding ICAL.
	 */
	toICALJs(): ICAL.Component {
		return this.timezone.component
	}

	/**
	 * Initializes the inner ICAL.Timezone component if not already done.
	 */
	private get timezone(): ICAL.Timezone {
		if (!this._initialized) {
			const jCal = ICAL.parse(this._ics!)
			const iCalComponent = new ICAL.Component(jCal)
			this._timezone = new ICAL.Timezone(iCalComponent)
			this._initialized = true
		}
		return this._timezone!
	}

	public static get utc() {
		return new Timezone(ICAL.Timezone.utcTimezone)
	}

	public static get floating() {
		return new Timezone(ICAL.Timezone.localTimezone)
	}

}
