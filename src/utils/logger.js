import chalk from 'chalk';
import ora from 'ora';

// ─── Stage Headers ────────────────────────────────────────────────────────────

export function stageHeader(number, title, icon) {
  const line = '─'.repeat(50);
  console.log(`\n${chalk.gray(line)}`);
  console.log(`${chalk.bold.cyan(`  Stage ${number}`)} ${chalk.bold.white(`— ${icon}  ${title}`)}`);
  console.log(`${chalk.gray(line)}\n`);
}

export function pipelineHeader(seedDomain) {
  const banner = `
${chalk.bold.cyan('╔══════════════════════════════════════════════╗')}
${chalk.bold.cyan('║')}   ${chalk.bold.white('Subspace Outreach Pipeline')}                  ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚══════════════════════════════════════════════╝')}

  ${chalk.gray('Seed domain :')} ${chalk.bold.white(seedDomain)}
  ${chalk.gray('Started at  :')} ${chalk.white(new Date().toLocaleTimeString())}
`;
  console.log(banner);
}

// ─── Log Helpers ──────────────────────────────────────────────────────────────

export const log = {
  success: (msg) => console.log(`  ${chalk.green('✔')} ${chalk.white(msg)}`),
  error:   (msg) => console.error(`  ${chalk.red('✖')} ${chalk.red(msg)}`),
  warn:    (msg) => console.warn(`  ${chalk.yellow('⚠')} ${chalk.yellow(msg)}`),
  info:    (msg) => console.log(`  ${chalk.blue('ℹ')} ${chalk.gray(msg)}`),
  detail:  (label, value) => console.log(`    ${chalk.gray(label.padEnd(20))} ${chalk.white(value)}`),
};

// ─── Spinners ─────────────────────────────────────────────────────────────────

export function spinner(text) {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots',
  }).start();
}

// ─── Summary Table Helper ─────────────────────────────────────────────────────

export function printSummaryLine(label, value) {
  console.log(`  ${chalk.gray(label.padEnd(22))} ${chalk.bold.white(value)}`);
}

// ─── Section Divider ──────────────────────────────────────────────────────────

export function divider() {
  console.log(chalk.gray(`\n  ${'─'.repeat(48)}\n`));
}
