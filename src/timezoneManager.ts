/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'
import { Timezone } from './timezone.ts'
import tzData from '../resources/timezones/zones.json' with { type: 'json' }

export class TimezoneManager {

	/**
	 * Map of aliases
	 * Alias name => timezoneId
	 */
	private _aliases = new Map<string, string>()

	/**
	 * Map of Timezones
	 * timezoneId => Timezone
	 */
	private _timezones = new Map<string, Timezone>()

	/**
	 * List of aliases that were registered while their targets were missing
	 * [[aliasName, timezoneId], ...]
	 */
	private _pendingAliases: [string, string][] = []

	/**
	 * Gets a timezone for the given id.
	 *
	 * @param timezoneId - The id of the timezone
	 */
	public getTimezoneForId(timezoneId: string): Timezone | null {
		let level = 0
		while (level++ < 20) {
			if (this._timezones.has(timezoneId)) {
				return this._timezones.get(timezoneId)
			}

			if (this._aliases.has(timezoneId)) {
				timezoneId = this._aliases.get(timezoneId)
			} else {
				return null
			}
		}

		console.error('TimezoneManager.getTimezoneForIdRec() exceeds recursion limits')
		return null
	}

	/**
	 * Checks if there is a timezone for the given id stored in this manager.
	 *
	 * @param timezoneId - The id of the timezone
	 */
	hasTimezoneForId(timezoneId: string): boolean {
		return this._timezones.has(timezoneId) || this._aliases.has(timezoneId)
	}

	/**
	 * Checks if the given timezone id is an alias.
	 *
	 * @param timezoneId - The id of the timezone
	 */
	isAlias(timezoneId: string): boolean {
		return !this._timezones.has(timezoneId) && this._aliases.has(timezoneId)
	}

	/**
	 * Lists all timezones.
	 *
	 * @param includeAliases - Whether or not to include aliases
	 */
	listAllTimezones(includeAliases = false): string[] {
		const timezones = Array.from(this._timezones.keys())

		if (includeAliases) {
			return timezones.concat(Array.from(this._aliases.keys()))
		}

		return timezones
	}

	/**
	 * Registers a timezone
	 *
	 * @param timezone - The timezone-object to register
	 */
	registerTimezone(timezone: Timezone): void {
		this._timezones.set(timezone.timezoneId, timezone)
		ICAL.TimezoneService.register(timezone.toICALTimezone(), timezone.timezoneId)

		// Try to resolve pending aliases and remove them from the list
		this._pendingAliases = this._pendingAliases.filter(([aliasName, timezoneId]) => {
			if (timezoneId !== timezone.timezoneId) {
				return true
			}

			ICAL.TimezoneService.register(timezone.toICALTimezone(), aliasName)
			return false
		})
	}

	registerDefaultTimezones(): void {
		console.debug(`@nextcloud/calendar-js app is using version ${tzData.version} of the timezone database`)

		for (const tzid in tzData.zones) {
			const ics = [
				'BEGIN:VTIMEZONE',
				'TZID:' + tzid,
				...tzData.zones[tzid].ics,
				'END:VTIMEZONE',
			].join('\r\n')
			this.registerTimezoneFromICS(tzid, ics)
		}

		for (const [tzid, alias] of Object.entries(tzData.aliases)) {
			this.registerAlias(tzid, alias)
		}
	}

	/**
	 * Registers a timezone based on ics data.
	 *
	 * @param timezoneId - The id of the timezone
	 * @param ics - The iCalendar timezone definition
	 */
	registerTimezoneFromICS(timezoneId: string, ics: string): void {
		const timezone = new Timezone(timezoneId, ics)
		this.registerTimezone(timezone)
	}

	/**
	 * Registers a new timezone-alias
	 *
	 * @param aliasName - The timezone-id of the alias
	 * @param timezoneId - The timezone-id to resolve the alias to
	 */
	registerAlias(aliasName: string, timezoneId: string): void {
		this._aliases.set(aliasName, timezoneId)

		const resolvedTimezone = this.getTimezoneForId(timezoneId)
		if (!resolvedTimezone) {
			this._pendingAliases.push([aliasName, timezoneId])
			return
		}
		ICAL.TimezoneService.register(resolvedTimezone.toICALTimezone(), aliasName)
	}

	/**
	 * Unregisters a timezone.
	 *
	 * @param timezoneId - Unregisters a timezone by Id
	 */
	unregisterTimezones(timezoneId: string): void {
		this._timezones.delete(timezoneId)
		ICAL.TimezoneService.remove(timezoneId)
	}

	/**
	 * Unregisters a timezone-alias.
	 *
	 * @param aliasName - The alias to unregister
	 */
	unregisterAlias(aliasName: string): void {
		this._aliases.delete(aliasName)
		this._pendingAliases = this._pendingAliases
			.filter(([pendingAliasName]) => pendingAliasName !== aliasName)
		ICAL.TimezoneService.remove(aliasName)
	}

	/**
	 * Clear all timezones
	 */
	clearAllTimezones() {
		this._aliases = new Map()
		this._pendingAliases = []
		this._timezones = new Map()

		ICAL.TimezoneService.reset()

		timezoneManager.registerTimezone(Timezone.utc)
		timezoneManager.registerTimezone(Timezone.floating)
		timezoneManager.registerAlias('GMT', Timezone.utc.timezoneId)
		timezoneManager.registerAlias('Z', Timezone.utc.timezoneId)
	}

}

const timezoneManager = new TimezoneManager()
timezoneManager.clearAllTimezones()

/**
 * Gets the default instance of the timezone manager
 */
export function getTimezoneManager(): TimezoneManager {
	return timezoneManager
}
