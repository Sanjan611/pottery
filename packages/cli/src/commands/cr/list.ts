import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectStore } from '@pottery/core';
import { formatCRList } from '../../output';

export const listCRCommand = new Command('list')
  .description('List all change requests for a project')
  .requiredOption('--project-id <id>', 'Project ID')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        console.error(chalk.red(`\n✗ Project ${options.projectId} not found\n`));
        process.exit(1);
      }

      const metadata = await store.loadMetadata();
      const crs = await store.listChangeRequests();

      console.log(chalk.bold(`\nProject: ${chalk.cyan(options.projectId)}`), chalk.gray(`(${metadata.name || 'unnamed'})`));
      console.log('');
      console.log(formatCRList(crs));
      console.log('');
      console.log(chalk.gray(`Use 'pottery cr show --project-id ${options.projectId} --cr-id <cr-id>' for details`));
      console.log('');

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
