/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts: the @nextcloud/vite-config library preset
// (dts plugin, browserslist oxc targets) is only meant for builds and breaks vitest.
export default defineConfig({})
