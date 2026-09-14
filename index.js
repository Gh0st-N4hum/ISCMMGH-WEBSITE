// schemaTypes/index.js
//
// This is what sanity.config.js imports. Adding a new content type
// later (e.g. "boardMember") means: create the file, import it here,
// add it to the array below.

import doctor from './doctor'
import announcement from './announcement'
import siteSettings from './siteSettings'

export const schemaTypes = [doctor, announcement, siteSettings]
