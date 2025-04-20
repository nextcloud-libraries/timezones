/**
 * SPDX-FileCopyrightText: 2021-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface IRegion {
	cities: string[]
	label: string
	timezoneId: string
}

interface IContinent {
	continent: string
	regions: IRegion[]
}

export interface ITimezone {
	continent: string
	label: string
	timezoneId: string
}

/**
 * @param timezoneList - List of Olsen timezones
 * @param additionalTimezones - List of additional timezones
 * @param globalTimezoneName - The localized name of the "Global" timezones
 */
export function getSortedTimezoneList(
	timezoneList: string[] = [],
	additionalTimezones: ITimezone[] = [],
	globalTimezoneName = 'Global',
): IContinent[] {
	const sortedByContinent = new Map<string, IContinent>()
	for (const timezoneId of timezoneList) {
		const components = timezoneId.split('/')
		let [continent, name] = [components.shift()!, components.join('/')]
		if (!name) {
			name = continent
			continent = globalTimezoneName
		}

		if (!sortedByContinent.has(continent)) {
			sortedByContinent.set(continent, {
				continent,
				regions: [],
			})
		}

		sortedByContinent.get(continent)!.regions.push({
			label: getReadableTimezoneName(name),
			cities: [],
			timezoneId,
		})
	}

	for (const { continent, label, timezoneId } of additionalTimezones) {
		if (!sortedByContinent.has(continent)) {
			sortedByContinent.set(continent, {
				continent,
				regions: [],
			})
		}

		sortedByContinent.get(continent)!.regions.push({
			label,
			cities: [],
			timezoneId,
		})
	}

	// create list sorted by continents
	const sortedList = [...sortedByContinent.values()]
		.sort((a, b) => a.continent.localeCompare(b.continent))
	// sort all regions inside the sorted list
	for (const { regions } of sortedList) {
		regions.sort((a, b) => a.label.localeCompare(b.label))
	}

	return sortedList
}

/**
 * Get human-readable name for timezoneId
 *
 * @param timezoneId - TimezoneId to turn human-readable
 */
export function getReadableTimezoneName(timezoneId: string): string {
	return timezoneId
		.split('_')
		.join(' ')
		.replace('St ', 'St. ')
		.split('/')
		.join(' - ')
}

/**
 * @param tzName Name of the timezone to check
 */
export function isOlsonTimezone(tzName: string): boolean {
	const hasSlash = tzName.includes('/')
	const hasSpace = tzName.includes(' ')
	const startsWithETC = tzName.startsWith('Etc')
	const startsWithUS = tzName.startsWith('US/')

	return hasSlash && !hasSpace && !startsWithETC && !startsWithUS
}
