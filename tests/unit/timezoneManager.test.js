/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { beforeEach, expect, test } from 'vitest'
import { getTimezoneManager, isOlsonTimezone } from '../../src/timezoneManager.js';
import Timezone from '../../src/timezone.js';

beforeEach(() => {
	getTimezoneManager().clearAllTimezones()
})

test('TimezoneManager should provide a method to get a timezone by id - existing timezone', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(timezoneManager.getTimezoneForId('Europe/Berlin')).toEqual(tzBerlin)
})

test('TimezoneManager should be able to self-register a default set of timezones', () => {
	const timezoneManager = getTimezoneManager()

	timezoneManager.registerDefaultTimezones()

	expect(timezoneManager.listAllTimezones().length).toBeGreaterThan(400)
})

test('TimezoneManager should provide a method to get a timezone by id - by alias', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(timezoneManager.getTimezoneForId('foobar/Berlin')).toEqual(tzBerlin)
})

test('TimezoneManager should provide a method to get a timezone by id - by recursive alias', () => {
	const timezoneManager = getTimezoneManager()

	const tzKolkata = new Timezone('Asia/Kolkata', getAsset('timezone-asia-kolkata'))

	timezoneManager.registerTimezone(tzKolkata)
	timezoneManager.registerAlias('Asia/Calcutta', 'Asia/Kolkata')
	timezoneManager.registerAlias('India Standard Time', 'Asia/Calcutta')

	expect(timezoneManager.getTimezoneForId('India Standard Time')).toEqual(tzKolkata)
})

test('TimezoneManager should provide a method to get a timezone by id - by recursive alias, recursion limit', () => {
	const timezoneManager = getTimezoneManager()

	timezoneManager.registerAlias('alias-one', 'alias-two')
	timezoneManager.registerAlias('alias-two', 'alias-one')

	expect(timezoneManager.getTimezoneForId('alias-one')).toEqual(null)
})

test('TimezoneManager should provide a method to get a timezone by id - by alias non-existant', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(timezoneManager.getTimezoneForId('foobar/Stuttgart')).toEqual(null)
})

test('TimezoneManager should provide a method to get a timezone by id - unknown', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(timezoneManager.getTimezoneForId('unknown')).toEqual(null)
})

test('TimezoneManager should provide a method to check if a certain timezone is known', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(true)
	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(true)
	expect(timezoneManager.hasTimezoneForId('America/Los_Angeles')).toEqual(true)
	expect(timezoneManager.hasTimezoneForId('foobar/Berlin')).toEqual(true)
})

test('TimezoneManager should provide a list of built-in timezones', () => {
	const timezoneManager = getTimezoneManager()

	expect(timezoneManager.listAllTimezones()).toEqual(["UTC", "floating"])
})

test('TimezoneManager should provide a list of built-in timezones and aliases', () => {
	const timezoneManager = getTimezoneManager()

	expect(timezoneManager.listAllTimezones(true)).toEqual(["UTC", "floating", "GMT", "Z"])
})

test('TimezoneManager should provide a list of all timezones', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.listAllTimezones()).toEqual(["UTC", "floating", "Europe/Berlin", "America/New_York", "America/Los_Angeles"])
})

test('TimezoneManager should provide a list of all timezones to include all aliases', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.listAllTimezones(true)).toEqual(["UTC", "floating", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "GMT", "Z", 'foobar/Berlin'])

})

test('TimezoneManager should provide a method to unregister timezones', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(true)

	timezoneManager.unregisterTimezones('Europe/Berlin')

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(false)
})

test('TimezoneManager should provide a method to unregister an alias', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.hasTimezoneForId('foobar/Berlin')).toEqual(true)

	timezoneManager.unregisterAlias('foobar/Berlin')

	expect(timezoneManager.hasTimezoneForId('foobar/Berlin')).toEqual(false)
})

test('TimezoneManager should provide a method to register timezone from is', () => {
	const timezoneManager = getTimezoneManager()

	timezoneManager.registerTimezoneFromICS('Europe/Berlin', getAsset('timezone-europe-berlin'))
	timezoneManager.registerTimezoneFromICS('America/New_York', getAsset('timezone-america-nyc'))
	timezoneManager.registerTimezoneFromICS('America/Los_Angeles', getAsset('timezone-america-la'))

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(true)
})

test('TimezoneManager should provide a method to clear all timezones', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(true)
	expect(timezoneManager.hasTimezoneForId('foobar/Berlin')).toEqual(true)

	timezoneManager.clearAllTimezones()

	expect(timezoneManager.hasTimezoneForId('Europe/Berlin')).toEqual(false)
	expect(timezoneManager.hasTimezoneForId('foobar/Berlin')).toEqual(false)
})

test('TimezoneManager should provide a default instance', () => {
	const tzManager1 = getTimezoneManager()
	const tzManager2 = getTimezoneManager()

	expect(tzManager1.getTimezoneForId('UTC')).toEqual(Timezone.utc)
	expect(tzManager1.getTimezoneForId('GMT')).toEqual(Timezone.utc)
	expect(tzManager1.getTimezoneForId('Z')).toEqual(Timezone.utc)
	expect(tzManager1.getTimezoneForId('floating')).toEqual(Timezone.floating)

	expect(tzManager1).toEqual(tzManager2)

	expect(tzManager1.hasTimezoneForId('Europe/Berlin')).toEqual(false)
	expect(tzManager2.hasTimezoneForId('Europe/Berlin')).toEqual(false)

	tzManager1.registerTimezone(new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin')))

	expect(tzManager1.hasTimezoneForId('Europe/Berlin')).toEqual(true)
	expect(tzManager2.hasTimezoneForId('Europe/Berlin')).toEqual(true)
})

test('TimezoneManager should provide a method to check if a name is an alias', () => {
	const timezoneManager = getTimezoneManager()

	const tzBerlin = new Timezone('Europe/Berlin', getAsset('timezone-europe-berlin'))
	const tzNYC = new Timezone('America/New_York', getAsset('timezone-america-nyc'))
	const tzLA = new Timezone('America/Los_Angeles', getAsset('timezone-america-la'))

	timezoneManager.registerTimezone(tzBerlin)
	timezoneManager.registerTimezone(tzNYC)
	timezoneManager.registerTimezone(tzLA)
	timezoneManager.registerAlias('foobar/Berlin', 'Europe/Berlin')
	timezoneManager.registerAlias('foobar/Stuttgart', 'unknown')

	expect(timezoneManager.isAlias('Europe/Berlin')).toEqual(false)
	expect(timezoneManager.isAlias('foobar/Berlin')).toEqual(true)
})

test('TimezoneManager should provide method to check if a given timezone is an Olson timezone', () => {
	expect(isOlsonTimezone('Europe/Berlin')).toEqual(true)
	expect(isOlsonTimezone('US/Western')).toEqual(false)
})
