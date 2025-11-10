import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectStore } from '@pottery/core';

export const deleteCRCommand = new Command('delete')
  .description('Delete a pending change request')
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

      const spinner = ora(`Deleting ${options.crId}...`).start();

      // Delete the change request (will throw if already applied)
      await store.deleteChangeRequest(options.crId);

      spinner.succeed(chalk.green(`Deleted pending ChangeRequest ${options.crId}`));
      console.log('');

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
