// schemaTypes/doctor.js
//
// Matches the "Meet our doctors" section of the site — each field
// here maps directly to something already shown on a .doctor-card.

export default {
  name: 'doctor',
  title: 'Doctor',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      description: 'Include the title, e.g. "Dr. Jason Bocaling"',
      validation: (Rule) => Rule.required(),
    },
    {
  name: 'specialization',
  title: 'Specialization',
  type: 'string',
  options: {
    list: [
      'Cardiology', 'Pulmonology', 'Pediatrics', 'General Surgery',
      'Internal Medicine', 'OB-GYN', 'General Medicine',
      'Orthopedics', 'Dermatology', 'ENT (Otorhinolaryngology)', 'Other'
    ],
  },
  validation: (Rule) => Rule.required(),
},
{
  name: 'background',
  title: 'Background / Bio',
  type: 'text',
  rows: 4,
  description: 'Education, experience, or a short professional background — shown on the doctor\'s profile.',
},
    {
      name: 'consultationDays',
      title: 'Consultation Days',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    },
    {
      name: 'clinicHours',
      title: 'Clinic Hours',
      type: 'string',
      description: 'e.g. "9 AM – 12 NN"',
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'specialization',
      media: 'photo',
    },
  },
}
