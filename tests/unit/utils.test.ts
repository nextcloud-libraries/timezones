/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, test } from 'vitest'
import {
	getReadableTimezoneName,
	getSortedTimezoneList,
	isOlsonTimezone,
} from '../../src/utils.ts'

describe('timezone sorter', () => {

	test('should sort a timezone list', () => {
		const sorted = getSortedTimezoneList(
			[
				'Europe/Berlin',
				'Europe/Amsterdam',
				'Europe/Paris',
				'America/New_York',
				'America/Los_Angeles',
				'UTC',
				'Z',
				'GMT',
			],
			[{
				continent: 'FOO',
				label: 'ABC',
				timezoneId: 'id123',
			}, {
				continent: 'Global',
				label: 'DEF',
				timezoneId: 'id456',
			}],
			'Global',
		)

		expect(sorted.length).toEqual(4)
		expect(sorted[0].continent).toEqual('America')
		expect(sorted[0].regions).toEqual([{
			cities: [],
			label: 'Los Angeles',
			timezoneId: 'America/Los_Angeles',
		}, {
			cities: [],
			label: 'New York',
			timezoneId: 'America/New_York',
		}])

		expect(sorted[1].continent).toEqual('Europe')
		expect(sorted[1].regions).toEqual([{
			cities: [],
			label: 'Amsterdam',
			timezoneId: 'Europe/Amsterdam',
		}, {
			cities: [],
			label: 'Berlin',
			timezoneId: 'Europe/Berlin',
		}, {
			cities: [],
			label: 'Paris',
			timezoneId: 'Europe/Paris',
		}])

		expect(sorted[2].continent).toEqual('FOO')
		expect(sorted[2].regions).toEqual([{
			cities: [],
			label: 'ABC',
			timezoneId: 'id123',
		}])

		expect(sorted[3].continent).toEqual('Global')
		expect(sorted[3].regions).toEqual([{
			cities: [],
			label: 'DEF',
			timezoneId: 'id456',
		}, {
			cities: [],
			label: 'GMT',
			timezoneId: 'GMT',
		}, {
			cities: [],
			label: 'UTC',
			timezoneId: 'UTC',
		}, {
			cities: [],
			label: 'Z',
			timezoneId: 'Z',
		}])
	})

	test('should get a readable timezone name', () => {
		expect(getReadableTimezoneName('Europe/Berlin')).toEqual('Europe - Berlin')
		expect(getReadableTimezoneName('America/New_York')).toEqual('America - New York')
		expect(getReadableTimezoneName('America/St_Johns')).toEqual('America - St. Johns')
		expect(getReadableTimezoneName('America/Argentina/Buenos_Aires')).toEqual('America - Argentina - Buenos Aires')
	})
})

describe('isOlsonTimezone', () => {
	test.each`
	text                            | expected
	${'Europe/Berlin'}              | ${true}
	${'Europe Berlin'}              | ${false}
	${'US/Western'}                 | ${false}
	${'Etc/GMT+0'}                  | ${false}
	${'Ekaterinburg Standard Time'} | ${false}
	`('check if $text is a valid timezone', ({ text, expected }) => {
		expect(isOlsonTimezone(text)).toEqual(expected)
	})
})
