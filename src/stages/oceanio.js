import { fetchWithRetry } from '../utils/api.js';
import { log, spinner } from '../utils/logger.js';
import chalk from 'chalk';

const OCEAN_API_BASE = 'https://api.ocean.io/v3';

// ─── Stage 1: Find Lookalike Companies ───────────────────────────────────────

/**
 * Queries Ocean.io for companies similar to the given seed domain.
 *
 * @param {string} seedDomain       e.g. "stripe.com"
 * @param {object} config
 * @param {number} config.maxCompanies
 * @returns {Promise<Array<{ domain, name, companySize, country, industries }>>}
 */
export async function findLookalikeCompanies(seedDomain, config) {
  const spin = spinner(`Searching for companies similar to ${chalk.bold(seedDomain)}...`);

  try {
    const body = {
      size: config.maxCompanies,
      fields: ['domain', 'name', 'companySize', 'primaryCountry', 'industries'],
      companiesFilters: {
        lookalikeDomains: [seedDomain],
      },
    };

    const data = await fetchWithRetry(
      `${OCEAN_API_BASE}/search/companies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Token': process.env.OCEAN_IO_API_KEY,
        },
        body: JSON.stringify(body),
      },
    );

    const companies = (data.companies || []).map((item) => {
      const c = item.company || {};
      return {
        domain:      c.domain       || '',
        name:        c.name         || c.domain || 'Unknown',
        companySize: c.companySize  || 'Unknown',
        country:     c.primaryCountry || 'Unknown',
        industries:  (c.industries  || []).join(', ') || 'Unknown',
      };
    }).filter((c) => c.domain); // Only keep companies with a domain

    spin.succeed(`Found ${chalk.bold(companies.length)} lookalike companies`);

    if (companies.length === 0) {
      log.warn('No lookalike companies found. Try a different seed domain.');
      return [];
    }

    // Print a compact preview
    console.log();
    companies.slice(0, 5).forEach((c, i) => {
      log.detail(`  ${i + 1}. ${c.name}`, chalk.gray(`(${c.domain}) — ${c.companySize}`));
    });
    if (companies.length > 5) {
      log.info(`  ... and ${companies.length - 5} more`);
    }
    console.log();

    return companies;

  } catch (err) {
    spin.fail('Ocean.io request failed');

    if (err.status === 401 || err.status === 403) {
      log.error('Invalid or expired Ocean.io API key. Check your OCEAN_IO_API_KEY.');
    } else {
      log.error(`Ocean.io error: ${err.message}`);
      if (err.body) log.info(`Response: ${err.body.slice(0, 200)}`);
    }

    throw err;
  }
}
