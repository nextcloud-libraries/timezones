/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect, test } from 'vitest'
import ICAL from 'ical.js'
import { Timezone } from '../../src/timezone.ts'
import { getAsset } from '../utils.ts'

test('Timezone should take two parameters: timezoneId and ics', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.timezoneId).toEqual(name)
})

test('Timezone should take one parameters: icalValue (ICAL.Timezone)', () => {
	const ics = getAsset('timezone-europe-berlin')
	const jCal = ICAL.parse(ics)
	const icalComp = new ICAL.Component(jCal)
	const icalTimezone = new ICAL.Timezone(icalComp)

	const timezone = new Timezone(icalTimezone)

	expect(timezone.timezoneId).toEqual('Europe/Berlin')
})

test('Timezone should take one parameters: icalValue (ICAL.Component)', () => {
	const ics = getAsset('timezone-europe-berlin')
	const jCal = ICAL.parse(ics)
	const icalComp = new ICAL.Component(jCal)

	const timezone = new Timezone(icalComp)

	expect(timezone.timezoneId).toEqual('Europe/Berlin')
})

test('Timezone should support lazy loading (Component)', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.timezoneId).toEqual(name)
	/// @ts-expect-error access private property for white-box-testing
	expect(timezone._initialized).toEqual(false)

	expect(timezone.toICALJs()).toBeInstanceOf(ICAL.Component)
	/// @ts-expect-error access private property for white-box-testing
	expect(timezone._initialized).toEqual(true)
})

test('Timezone should support lazy loading (Timezone)', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.timezoneId).toEqual(name)
	/// @ts-expect-error access private property for white-box-testing
	expect(timezone._initialized).toEqual(false)

	expect(timezone.toICALTimezone()).toBeInstanceOf(ICAL.Timezone)
	/// @ts-expect-error access private property for white-box-testing
	expect(timezone._initialized).toEqual(true)
})

test('Timezone should provide an offsetForArray method', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.offsetForArray(2019, 1, 1, 15, 30, 20)).toEqual(3600)
})

test('Timezone should provide an timestampToArray method', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.timestampToArray(1560937459931)).toEqual([
		2019,
		6,
		19,
		11,
		44,
		19,
	])
})

test('Timezone should provide an ICAL Timezone', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.toICALTimezone() instanceof ICAL.Timezone).toEqual(true)
})

test('Timezone should provide an ICAL.JS Component', () => {
	const name = 'Europe/Berlin'
	const ics = getAsset('timezone-europe-berlin')

	const timezone = new Timezone(name, ics)

	expect(timezone.toICALJs() instanceof ICAL.Component).toEqual(true)
})

test('Timezone should provide a default timezone for UTC', () => {
	expect(Timezone.utc).toBeDefined()
	expect(Timezone.utc.timezoneId).toEqual('UTC')
})

test('Timezone should provide a default timezone for floating times', () => {
	expect(Timezone.floating).toBeDefined()
	expect(Timezone.floating.timezoneId).toEqual('floating')
})
