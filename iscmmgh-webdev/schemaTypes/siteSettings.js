// schemaTypes/siteSettings.js
//
// A single shared document for the details that repeat across the
// site (header, hero info strip, footer, contact section) — so a
// phone number only ever needs to be updated in ONE place, not
// hunted down across five different pages.

export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'hotlineNumber',
      title: 'Main Hotline / Emergency Number',
      type: 'string',
      description: 'Shown in the top emergency bar and header.',
    },
    {
      name: 'erNumber',
      title: 'Emergency Room Number',
      type: 'string',
    },
    {
      name: 'admittingNumber',
      title: 'Admitting Number',
      type: 'string',
    },
    {
      name: 'labNumber',
      title: 'Laboratory Number',
      type: 'string',
    },
    {
      name: 'email',
      title: 'Email Address',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'string',
      description: 'e.g. "Tamag, Vigan City, Ilocos Sur"',
    },
    {
      name: 'opdHours',
      title: 'OPD Hours',
      type: 'string',
      description: 'e.g. "Mon–Sat, 8 AM–5 PM"',
    },
    {
      name: 'bedCount',
      title: 'Bed Capacity',
      type: 'number',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
}
