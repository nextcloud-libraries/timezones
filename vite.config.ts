/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createLibConfig } from '@nextcloud/vite-config'

export default createLibConfig({
	index: 'src/index.ts',
}, {
	libraryFormats: ['es', 'cjs'],
	DTSPluginOptions: { rollupTypes: true },
	thirdPartyLicense: false,
})
