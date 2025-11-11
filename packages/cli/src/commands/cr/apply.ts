import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectStore } from '@pottery/core';

export const applyCRCommand = new Command('apply')
  .description('Apply a change request to the graph')
  .requiredOption('--project-id <id>', 'Project ID')
  .requiredOption('--cr-id <cr-id>', 'Change Request ID')
  .action(async (options) => {
    const spinner = ora(`Applying ${options.crId} to project ${options.projectId}...`).start();

    try {
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        spinner.fail(`Project ${options.projectId} not found`);
        process.exit(1);
      }

      // Load CR to check status
      const cr = await store.loadChangeRequest(options.crId);

      if (cr.status === 'applied') {
        spinner.warn(`${options.crId} is already applied`);
        process.exit(0);
      }

      // Apply the change request
      spinner.text = 'Creating new nodes...';
      await store.applyChangeRequest(options.crId);

      const metadata = await store.loadMetadata();

      spinner.succeed(chalk.green('Product graph updated successfully!'));

      console.log('');
      console.log(chalk.gray(`  ✓ Graph version: ${metadata.current_version}`));
      console.log(chalk.gray(`  ✓ ${cr.new_nodes.length} nodes created`));
      console.log(chalk.gray(`  ✓ ${cr.modified_nodes.length} nodes modified`));
      console.log(chalk.gray(`  ✓ ${cr.new_dependencies.length} dependencies added`));
      console.log('');
      console.log(chalk.bold('📊 View changes:'));
      console.log(chalk.gray(`  pottery serve --project-id ${options.projectId}`));
      console.log('');

    } catch (error: any) {
      spinner.fail('Failed to apply change request');
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
