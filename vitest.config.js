/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig(configEnv => mergeConfig(
	viteConfig(configEnv),
	defineConfig({
		test: {
			setupFiles: [
				'./tests/setup.js'
			]
		},
	}),
))
