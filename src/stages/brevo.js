import nodemailer from 'nodemailer';
import chalk from 'chalk';
import config from '../config.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Stage 3: Send personalized emails using Brevo SMTP
 *
 * @param {Array} contacts - List of enriched contacts { name, email, company, ... }
 * @param {string} seedDomain - The seed domain used for context in the template
 * @param {Object} spin - Ora spinner instance
 * @param {boolean} isDryRun - If true, do not send actual emails
 * @returns {number} Number of emails successfully sent
 */
export async function sendOutreachEmails(contacts, seedDomain, spin, isDryRun) {
  const { 
    BREVO_SMTP_HOST, 
    BREVO_SMTP_PORT, 
    BREVO_SMTP_USER, 
    BREVO_SMTP_KEY, 
    SENDER_EMAIL, 
    SENDER_NAME 
  } = process.env;

  if (!isDryRun) {
    if (!BREVO_SMTP_KEY || !BREVO_SMTP_USER || !SENDER_EMAIL) {
      spin.fail('Missing Brevo SMTP credentials or SENDER_EMAIL in .env');
      process.exit(1);
    }
  }

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(BREVO_SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: BREVO_SMTP_USER,
      pass: BREVO_SMTP_KEY,
    },
  });

  if (!isDryRun) {
    try {
      spin.text = 'Verifying SMTP connection...';
      await transporter.verify();
    } catch (error) {
      spin.fail(`SMTP Connection failed: ${error.message}`);
      process.exit(1);
    }
  }

  let sentCount = 0;
  
  for (const contact of contacts) {
    const firstName = contact.name.split(' ')[0] || 'there';
    
    // Dynamic outreach template
    const subject = `Question about ${contact.company}`;
    const textBody = `Hi ${firstName},\n\nI noticed ${contact.company} operates in a similar space to ${seedDomain} and I was wondering if you are facing similar scaling challenges.\n\nWe've helped companies in your exact space improve their operations. Would you be open to a quick chat next week?\n\nBest regards,\n${SENDER_NAME}`;
    const htmlBody = `
      <p>Hi ${firstName},</p>
      <p>I noticed <strong>${contact.company}</strong> operates in a similar space to <strong>${seedDomain}</strong> and I was wondering if you are facing similar scaling challenges.</p>
      <p>We've helped companies in your exact space improve their operations. Would you be open to a quick chat next week?</p>
      <br/>
      <p>Best regards,<br/><strong>${SENDER_NAME}</strong></p>
    `;

    if (isDryRun) {
      spin.stop();
      console.log(chalk.yellow(`\n  [DRY RUN] Would send to ${contact.email}:`));
      console.log(chalk.gray('  Subject:'), subject);
      console.log(chalk.gray('  Body:   '), textBody.replace(/\n/g, '\n            '));
      sentCount++;
      continue;
    }

    spin.start(`Sending email to ${chalk.yellow(contact.email)}...`);

    try {
      await transporter.sendMail({
        from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
        to: contact.email,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      sentCount++;
      // Wait to respect Brevo rate limits
      await sleep(config.emailDelayMs || 1000);
    } catch (err) {
      spin.stop();
      console.error(chalk.red(`\n❌ Failed to send to ${contact.email}: ${err.message}`));
    }
  }

  if (isDryRun) {
    console.log('\n  ' + chalk.yellow('✔ Dry run complete. No emails were actually sent.'));
  } else {
    spin.succeed(`Successfully sent ${chalk.bold(sentCount)} emails out of ${contacts.length}.`);
  }
  
  return sentCount;
}
