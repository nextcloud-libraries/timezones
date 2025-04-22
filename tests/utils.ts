/*!
 * SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Global helper function to load an ics asset by name
 *
 * @param {string} assetName Name of the asset to load
 * @return {string} The raw ICS data of the asset
 */
export function getAsset(assetName: string) {
	return readFileSync(resolve(__dirname, 'assets/', assetName + '.ics'), 'utf8')
}
