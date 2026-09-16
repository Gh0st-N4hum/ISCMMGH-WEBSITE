// schemaTypes/announcement.js
//
// Matches the "What's happening at ISCMMGH" news board — each field
// maps to what's already shown on a .news-card.

export default {
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'tag',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Medical Mission', 'Vaccine Drive', 'Holiday Notice', 'General Update'],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional — shown on the announcement card if uploaded.',
    },
    {
      name: 'body',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Keep this short — one or two sentences, like the current cards.',
    },
    {
      name: 'date',
      title: 'Date / Schedule Note',
      type: 'string',
      description: 'e.g. "This Saturday, 8 AM–12 NN" or "Ongoing this month" — kept as free text since these are often relative, not a single fixed date.',
    },
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tag',
      media: 'image',
    },
  },
}

