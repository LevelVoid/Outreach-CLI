import readline from 'readline';
import chalk from 'chalk';

// ─── Confirm Prompt ───────────────────────────────────────────────────────────

/**
 * Prompts the user with a yes/no question and returns a Promise<boolean>.
 * Accepts: yes, y (true) | no, n (false)
 */
export function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n  ${chalk.bold.yellow('?')} ${chalk.bold(question)} ${chalk.gray('(yes/no)')} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'yes' || normalized === 'y');
    });
  });
}
