/**
 * SPDX-FileCopyrightText: 2021-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 *
 * @param {string[]} timezoneList List of Olsen timezones
 * @param {Array} additionalTimezones List of additional timezones
 * @param {string} globalTimezoneName The localized name of the "Global" timezones
 * @return {[]}
 */
export function getSortedTimezoneList(timezoneList = [], additionalTimezones = [], globalTimezoneName = 'Global') {
	const sortedByContinent = {}
	const sortedList = []

	for (const timezoneId of timezoneList) {
		const components = timezoneId.split('/')
		let [continent, name] = [components.shift(), components.join('/')]
		if (!name) {
			name = continent
			continent = globalTimezoneName
		}

		sortedByContinent[continent] = sortedByContinent[continent] || {
			continent,
			regions: [],
		}

		sortedByContinent[continent].regions.push({
			label: getReadableTimezoneName(name),
			cities: [],
			timezoneId,
		})
	}

	for (const additionalTimezone of additionalTimezones) {
		const { continent, label, timezoneId } = additionalTimezone

		sortedByContinent[continent] = sortedByContinent[continent] || {
			continent,
			regions: [],
		}

		sortedByContinent[continent].regions.push({
			label,
			cities: [],
			timezoneId,
		})
	}

	for (const continent in sortedByContinent) {
		if (!Object.prototype.hasOwnProperty.call(sortedByContinent, continent)) {
			continue
		}

		sortedByContinent[continent].regions.sort((a, b) => {
			if (a.label < b.label) {
				return -1
			}

			return 1
		})
		sortedList.push(sortedByContinent[continent])
	}

	// Sort continents by name
	sortedList.sort((a, b) => {
		if (a.continent < b.continent) {
			return -1
		}

		return 1
	})

	return sortedList
}

/**
 * Get human-readable name for timezoneId
 *
 * @param {string} timezoneId TimezoneId to turn human-readable
 * @return {string}
 */
export function getReadableTimezoneName(timezoneId) {
	return timezoneId
		.split('_')
		.join(' ')
		.replace('St ', 'St. ')
		.split('/')
		.join(' - ')
}
