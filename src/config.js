// ─── Default Configuration ────────────────────────────────────────────────────
// All values can be overridden at runtime via CLI flags (see src/index.js).

const config = {
  // Stage 1: Ocean.io — how many lookalike companies to fetch
  maxCompanies: 10,

  // Stage 2: Prospeo — how many decision-makers to target per company
  contactsPerCompany: 2,

  // Stage 2: Prospeo — job titles to filter for (C-suite + VP-level)
  jobTitles: [
    'CEO',
    'CTO',
    'CFO',
    'COO',
    'VP',
    'Vice President',
    'Director',
    'Head of',
    'Chief',
  ],

  // Stage 3: Brevo — delay between email sends to stay within rate limits
  emailDelayMs: 1000,

  // Stage 3: Brevo free tier daily limit
  breevoFreeLimit: 300,
};

export default config;
