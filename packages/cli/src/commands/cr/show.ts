import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { ProjectStore } from '@pottery/core';
import { formatCRDetail } from '../../output';

export const showCRCommand = new Command('show')
  .description('Show details of a change request')
  .requiredOption('--project-id <id>', 'Project ID')
  .requiredOption('--cr-id <cr-id>', 'Change Request ID')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        console.error(chalk.red(`\n✗ Project ${options.projectId} not found\n`));
        process.exit(1);
      }

      const cr = await store.loadChangeRequest(options.crId);

      console.log('');
      console.log(boxen(
        formatCRDetail(cr),
        {
          padding: 1,
          borderColor: cr.status === 'pending' ? 'yellow' : 'green',
          title: `Project: ${options.projectId}`,
          titleAlignment: 'center'
        }
      ));
      console.log('');

      if (cr.status === 'pending') {
        console.log(chalk.bold('Apply:'));
        console.log(chalk.gray(`  pottery cr apply --project-id ${options.projectId} --cr-id ${options.crId}`));
        console.log('');
      }

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
