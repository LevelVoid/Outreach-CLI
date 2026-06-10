import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import readline from 'readline';
import { findLookalikeCompanies } from './stages/oceanio.js';
import { findDecisionMakers } from './stages/prospeo.js';
import { sendOutreachEmails } from './stages/brevo.js';

export async function runPipeline(seedDomain, config) {
  const isDryRun = config.dryRun;

  console.log('\n' + chalk.blue.bold('╔══════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║   Subspace Outreach Pipeline                  ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════╝\n'));

  console.log(`  ${chalk.bold('Seed domain')} : ${seedDomain}`);
  console.log(`  ${chalk.bold('Started at')}  : ${new Date().toLocaleTimeString()}\n`);

  if (isDryRun) {
    console.log(chalk.yellow('  ⚠  DRY RUN mode — emails will NOT be sent.\n'));
  }

  const spin = ora({
    text: 'Initializing...',
    color: 'blue',
  });

  try {
    // ---------------------------------------------------------
    // Stage 1: Ocean.io
    // ---------------------------------------------------------
    console.log('\n' + chalk.magenta('──────────────────────────────────────────────────'));
    console.log(chalk.magenta.bold('  Stage 1 — 🌐  Ocean.io — Finding Lookalike Companies'));
    console.log(chalk.magenta('──────────────────────────────────────────────────\n'));

    spin.start(`Searching for companies similar to ${chalk.bold(seedDomain)}...`);
    const companies = await findLookalikeCompanies(seedDomain, config, spin);

    if (companies.length === 0) {
      spin.fail('No lookalike companies found. Exiting.');
      return;
    }

    // Print table of companies
    const compTable = new Table({
      head: [chalk.cyan('Company Name'), chalk.cyan('Domain'), chalk.cyan('Size')],
      style: { head: [], border: [] },
    });

    companies.forEach((c) => {
      compTable.push([c.name, chalk.underline(c.domain), c.companySize]);
    });
    console.log('\n' + compTable.toString() + '\n');
    console.log(`  ${chalk.green('✔')} Stage 1 complete — ${companies.length} companies queued for prospecting\n`);

    // ---------------------------------------------------------
    // Stage 2: Prospeo
    // ---------------------------------------------------------
    console.log('\n' + chalk.magenta('──────────────────────────────────────────────────'));
    console.log(chalk.magenta.bold('  Stage 2 — 🧑‍💼 Prospeo — Finding Decision Makers'));
    console.log(chalk.magenta('──────────────────────────────────────────────────\n'));

    spin.start('Connecting to Prospeo...');
    const contacts = await findDecisionMakers(companies, spin);

    if (contacts.length === 0) {
      spin.warn('No decision makers found across the lookalike companies. Exiting.');
      return;
    }

    // Print table of contacts
    const contactTable = new Table({
      head: [chalk.cyan('Name'), chalk.cyan('Title'), chalk.cyan('Company'), chalk.cyan('Email')],
      style: { head: [], border: [] },
    });

    contacts.forEach((c) => {
      contactTable.push([c.name, c.title, c.company, c.email]);
    });
    console.log('\n' + contactTable.toString() + '\n');
    console.log(`  ${chalk.green('✔')} Stage 2 complete — ${contacts.length} decision makers queued for outreach\n`);

    // ---------------------------------------------------------
    // Stage 3: Brevo (Send Emails)
    // ---------------------------------------------------------
    console.log('\n' + chalk.magenta('──────────────────────────────────────────────────'));
    console.log(chalk.magenta.bold('  Stage 3 — ✉️  Brevo — Sending Outreach Emails'));
    console.log(chalk.magenta('──────────────────────────────────────────────────\n'));

    if (!isDryRun) {
      // Interactive confirmation using standard readline
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question(chalk.yellow(`⚠  Are you sure you want to send actual emails to ${contacts.length} contacts? (y/N): `), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.blue('\n  ℹ Email sending aborted by user. Pipeline finished gracefully.\n'));
        return;
      }
      
      console.log(); // Add empty line for spacing
    }

    spin.start('Connecting to Brevo SMTP...');
    await sendOutreachEmails(contacts, seedDomain, spin, isDryRun);

  } catch (error) {
    if (spin.isSpinning) {
      spin.fail('Pipeline failed');
    }
    console.error(chalk.red('\n❌ Error during pipeline execution:'));
    console.error(error.message || error);
    process.exit(1);
  }
}
