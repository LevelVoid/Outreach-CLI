import { stageHeader, log, divider } from './utils/logger.js';
import { findLookalikeCompanies } from './stages/oceanio.js';
import chalk from 'chalk';

// ─── Pipeline Orchestrator ────────────────────────────────────────────────────

/**
 * Runs the full outreach pipeline:
 *   Stage 1 → Ocean.io: find lookalike companies
 *   Stage 2 → Prospeo:  find decision-makers + emails  (wired in Step 4)
 *   Safety checkpoint:  user confirms before emails go out
 *   Stage 3 → Brevo:    send personalized emails        (wired in Step 5)
 *
 * @param {string} seedDomain
 * @param {object} config — merged defaults + CLI flags
 */
export async function runPipeline(seedDomain, config) {

  // ── Stage 1: Ocean.io ──────────────────────────────────────────────────────
  stageHeader(1, 'Ocean.io — Finding Lookalike Companies', '🌐');

  const companies = await findLookalikeCompanies(seedDomain, config);

  if (companies.length === 0) {
    log.warn('No companies to process. Pipeline stopped.');
    process.exit(0);
  }

  log.success(`Stage 1 complete — ${chalk.bold(companies.length)} companies queued for prospecting`);
  divider();

  // ── Stage 2: Prospeo (coming in Step 4) ───────────────────────────────────
  log.info('Stage 2 (Prospeo) will be wired in the next step...');
  divider();

  // Return companies so Step 3 tests can see the output
  return { companies };
}
