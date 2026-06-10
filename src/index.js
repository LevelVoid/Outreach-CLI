#!/usr/bin/env node
import 'dotenv/config';
import chalk from 'chalk';
import defaultConfig from './config.js';
import { pipelineHeader } from './utils/logger.js';
import { runPipeline } from './pipeline.js';

// ─── Help / Usage ────────────────────────────────────────────────────────────

const USAGE = `
${chalk.bold.cyan('Subspace')} — Automated Cold Outreach Pipeline
${'─'.repeat(50)}

${chalk.bold('Usage:')}
  node src/index.js ${chalk.yellow('<seed-domain>')} ${chalk.gray('[flags]')}

${chalk.bold('Examples:')}
  node src/index.js stripe.com
  node src/index.js stripe.com --max-companies 25
  node src/index.js stripe.com --contacts-per-company 5
  node src/index.js stripe.com --titles "CEO,CTO"
  node src/index.js stripe.com --dry-run

${chalk.bold('Flags:')}
  ${chalk.yellow('--max-companies <n>')}        Max lookalike companies from Ocean.io   ${chalk.gray(`[default: ${defaultConfig.maxCompanies}]`)}
  ${chalk.yellow('--contacts-per-company <n>')} Max decision-makers per company          ${chalk.gray(`[default: ${defaultConfig.contactsPerCompany}]`)}
  ${chalk.yellow('--titles <csv>')}             Comma-separated job titles to target     ${chalk.gray('[default: CEO,CTO,CFO,COO,VP,Director]')}
  ${chalk.yellow('--email-delay <ms>')}         Delay between emails in milliseconds     ${chalk.gray(`[default: ${defaultConfig.emailDelayMs}]`)}
  ${chalk.yellow('--dry-run')}                  Run all stages but skip sending emails
  ${chalk.yellow('--help')}                     Show this help message

${chalk.bold('Pipeline:')}
  ${chalk.cyan('Stage 1')} → Ocean.io   Find lookalike companies from seed domain
  ${chalk.cyan('Stage 2')} → Prospeo    Find decision-makers + verified emails
  ${chalk.cyan('Stage 3')} → Brevo      Send personalized outreach emails (with confirmation)
`;

// ─── Argument Parsing ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  const seedDomain = args[0];
  const flags = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--max-companies' && args[i + 1]) {
      flags.maxCompanies = parseInt(args[++i], 10);
    } else if (arg === '--contacts-per-company' && args[i + 1]) {
      flags.contactsPerCompany = parseInt(args[++i], 10);
    } else if (arg === '--titles' && args[i + 1]) {
      flags.jobTitles = args[++i].split(',').map((t) => t.trim());
    } else if (arg === '--email-delay' && args[i + 1]) {
      flags.emailDelayMs = parseInt(args[++i], 10);
    }
  }

  return { seedDomain, flags };
}

// ─── Env Validation ──────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  'OCEAN_IO_API_KEY',
  'PROSPEO_API_KEY',
  'BREVO_SMTP_HOST',
  'BREVO_SMTP_PORT',
  'BREVO_SMTP_USER',
  'BREVO_SMTP_KEY',
  'SENDER_EMAIL',
  'SENDER_NAME',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(chalk.red('\n✖ Missing required environment variables:'));
    missing.forEach((key) => console.error(chalk.red(`  • ${key}`)));
    console.error(chalk.gray('\n  Copy .env.example → .env and fill in your credentials.\n'));
    process.exit(1);
  }
}

// ─── Domain Validation ───────────────────────────────────────────────────────

function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    console.error(chalk.red(`\n✖ Invalid domain: "${domain}"`));
    console.error(chalk.gray('  Example: stripe.com\n'));
    process.exit(1);
  }
}

// ─── Build Effective Config ───────────────────────────────────────────────────

function buildConfig(flags) {
  return {
    ...defaultConfig,
    ...flags,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { seedDomain, flags } = parseArgs(process.argv);

  validateEnv();
  validateDomain(seedDomain);

  const config = buildConfig(flags);

  pipelineHeader(seedDomain);

  if (config.dryRun) {
    console.log(chalk.yellow('  ⚠  DRY RUN mode — emails will NOT be sent.\n'));
  }

  await runPipeline(seedDomain, config);
}

main().catch((err) => {
  console.error(chalk.red('\n✖ Fatal error:'), err.message);
  process.exit(1);
});
