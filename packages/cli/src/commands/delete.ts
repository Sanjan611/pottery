import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { GlobalProjectStore, ProjectStore } from '@pottery/core';

export const deleteCommand = new Command('delete')
  .description('Delete a project')
  .requiredOption('--project-id <id>', 'Project ID to delete')
  .action(async (options) => {
    try {
      const globalStore = new GlobalProjectStore();
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        console.error(chalk.red(`\n✗ Project ${options.projectId} not found\n`));
        process.exit(1);
      }

      // Load project info
      const metadata = await store.loadMetadata();
      const graph = await store.loadGraph();
      const crs = await store.listChangeRequests();

      // Display warning
      console.log(chalk.yellow.bold('\n⚠️  Warning:'), `This will permanently delete project ${chalk.cyan(options.projectId)}:`);
      console.log(chalk.gray(`   • Name: ${metadata.name || '(unnamed)'}`));
      console.log(chalk.gray(`   • ${graph.nodes.size} nodes`));
      console.log(chalk.gray(`   • ${crs.length} change requests (${crs.filter(cr => cr.status === 'pending').length} pending, ${crs.filter(cr => cr.status === 'applied').length} applied)`));
      console.log('');

      // Confirm deletion
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const confirmed = await new Promise<boolean>((resolve) => {
        rl.question(chalk.yellow(`Type project ID to confirm: `), (answer) => {
          rl.close();
          resolve(answer.trim() === options.projectId);
        });
      });

      if (!confirmed) {
        console.log(chalk.gray('\nDeletion cancelled\n'));
        process.exit(0);
      }

      // Delete project
      const spinner = ora('Deleting project...').start();
      await globalStore.deleteProject(options.projectId);
      spinner.succeed(chalk.green('Project deleted'));
      console.log('');

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
