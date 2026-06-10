import chalk from 'chalk';
import config from '../config.js';
import { fetchWithRetry } from '../utils/api.js';

const PROSPEO_API_BASE = 'https://api.prospeo.io';

/**
 * Stage 2: Find Decision Makers
 * Takes a list of companies, searches Prospeo for people at that company,
 * filters for executives, and enriches their profile to get emails.
 *
 * @param {Array} companies - Array of company objects { domain, name, ... }
 * @param {Object} spin - Ora spinner instance for UI feedback
 * @returns {Array} List of enriched contacts { name, title, email, company, linkedin }
 */
export async function findDecisionMakers(companies, spin) {
  const contacts = [];
  const apiKey = process.env.PROSPEO_API_KEY;

  if (!apiKey) {
    spin.fail('PROSPEO_API_KEY is missing in .env');
    process.exit(1);
  }

  for (const company of companies) {
    spin.text = `Searching for decision makers at ${chalk.blue(company.name)}...`;

    try {
      // 1. Search for people at the company
      const searchBody = {
        page: 1,
        filters: {
          company: {
            websites: {
              include: [company.domain],
            },
          },
        },
      };

      const searchData = await fetchWithRetry(`${PROSPEO_API_BASE}/search-person`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': apiKey,
        },
        body: JSON.stringify(searchBody),
      });

      if (searchData.error || !searchData.results) {
        continue; // Skip if no results or error
      }

      // 2. Filter people locally based on job titles in config
      const people = searchData.results
        .map((r) => r.person)
        .filter(Boolean);

      const decisionMakers = people.filter((person) => {
        const title = (person.current_job_title || person.title || '').toLowerCase();
        return config.jobTitles.some((targetTitle) =>
          title.includes(targetTitle.toLowerCase())
        );
      });

      // 3. Take the top N matches
      const targets = decisionMakers.slice(0, config.contactsPerCompany);

      // 4. Enrich targets to get their verified emails
      for (const target of targets) {
        const personId = target.id || target.person_id;
        let email = null;
        let linkedin = target.linkedin || target.linkedin_url || '';

        if (personId) {
          spin.text = `Enriching ${chalk.yellow(target.full_name)} from ${company.name}...`;
          
          try {
            const enrichPayload = {
              only_verified_email: true,
              enrich_mobile: false,
              data: {
                first_name: target.first_name || target.full_name.split(' ')[0],
                last_name: target.last_name || target.full_name.split(' ').slice(1).join(' '),
                company_website: company.domain
              }
            };

            const enrichData = await fetchWithRetry(`${PROSPEO_API_BASE}/enrich-person`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-KEY': apiKey,
              },
              body: JSON.stringify(enrichPayload),
            });

            if (!enrichData.error && enrichData.person) {
              const enrichedPerson = enrichData.person;
              email =
                enrichedPerson.email?.email ||
                enrichedPerson.work_email ||
                enrichedPerson.email ||
                null;
                
              linkedin = enrichedPerson.linkedin || linkedin;
            } else {
               console.log(`\nDebug Enrich Error for ${target.full_name}:`, JSON.stringify(enrichData));
            }
          } catch (enrichErr) {
            console.log(`\nDebug Enrich Exception for ${target.full_name}:`, enrichErr.message);
          }
        }

        // Only add to list if we successfully found an email
        if (email && typeof email === 'string') {
          contacts.push({
            name: target.full_name || `${target.first_name} ${target.last_name}`,
            title: target.current_job_title || target.title || '',
            email: email,
            linkedin: linkedin,
            company: company.name,
            domain: company.domain,
          });
        }
      }
    } catch (err) {
      // Continue to the next company if this one fails completely
      continue;
    }
  }

  spin.succeed(`Found ${chalk.bold(contacts.length)} decision makers with verified emails.`);
  return contacts;
}
