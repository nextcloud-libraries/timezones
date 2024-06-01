/**
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'fs'
import { afterAll, beforeAll } from 'vitest'

/**
 * Global helper function to load an ics asset by name
 *
 * @param {string} assetName Name of the asset to load
 * @return {string} The raw ICS data of the asset
 */
function getAsset(assetName) {
	return fs.readFileSync('tests/assets/' + assetName + '.ics', 'UTF8')
}

beforeAll(() => {
	global.getAsset = getAsset
})

afterAll(() => {
	delete global.getAsset
})
