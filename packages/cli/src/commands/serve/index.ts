import { Command } from 'commander';
import chalk from 'chalk';

export const serveCommand = new Command('serve')
  .description('Manage web UI server')
  .requiredOption('--project-id <id>', 'Project ID')
  .option('--port <port>', 'Port number', '3000')
  .action(async (options) => {
    console.log(chalk.yellow('\n⚠️  Web UI server not yet implemented'));
    console.log(chalk.gray('This feature will be available in a future update.'));
    console.log('');
  });
