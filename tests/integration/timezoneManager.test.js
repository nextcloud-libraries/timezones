/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { beforeEach, expect, test } from 'vitest'
import ICAL from 'ical.js'
import { Timezone } from '../../src/timezone.ts'
import { getTimezoneManager } from '../../src/timezoneManager.ts'
import { getAsset } from '../utils.ts'

beforeEach(() => {
	getTimezoneManager().clearAllTimezones()
})

test('TimezoneManager should propagate built-in time zones to ICAL.TimezoneService by default', () => {
	const timezoneManager = getTimezoneManager()

	for (const timezoneId of ['UTC', 'floating', 'GMT', 'Z']) {
		expect(timezoneManager.getTimezoneForId(timezoneId).toICALTimezone()).toEqual(ICAL.TimezoneService.get(timezoneId))
	}
})

test('TimezoneManager should propagate built-in time zones to ICAL.TimezoneService after clearing', () => {
	const timezoneManager = getTimezoneManager()

	timezoneManager.clearAllTimezones()

	for (const timezoneId of ['UTC', 'floating', 'GMT', 'Z']) {
		expect(timezoneManager.getTimezoneForId(timezoneId).toICALTimezone()).toEqual(ICAL.TimezoneService.get(timezoneId))
	}
})

test('TimezoneManager should propagate time zones to ICAL.TimezoneService', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)

	for (const timezone of [tzBerlin, tzNYC, tzLA]) {
		expect(ICAL.TimezoneService.has(timezone.timezoneId)).toBe(true)
		expect(ICAL.TimezoneService.get(timezone.timezoneId)).toEqual(timezone.toICALTimezone())
	}
})

test('TimezoneManager should propagate aliases to ICAL.TimezoneService', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(ICAL.TimezoneService.has('foobar/Berlin')).toBe(true)
	expect(ICAL.TimezoneService.get('foobar/Berlin')).toEqual(tzBerlin.toICALTimezone())
	expect(ICAL.TimezoneService.get('foobar/Berlin')).toEqual(ICAL.TimezoneService.get('Europe/Berlin'))
})

test('TimezoneManager should propagate pending aliases to ICAL.TimezoneService', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(ICAL.TimezoneService.has('foobar/Berlin')).toBe(false)
	expect(ICAL.TimezoneService.get('foobar/Berlin')).toBeFalsy()

	timezoneManager.registerTimezone(tzBerlin)

	expect(ICAL.TimezoneService.has('foobar/Berlin')).toBe(true)
	expect(ICAL.TimezoneService.get('foobar/Berlin')).toEqual(tzBerlin.toICALTimezone())
})

test('TimezoneManager should clear all time zones (except default ones) of ICAL.TimezoneService', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)

	expect(ICAL.TimezoneService.count).toBe(7)

	timezoneManager.clearAllTimezones()

	expect(ICAL.TimezoneService.count).toBe(4)
})
