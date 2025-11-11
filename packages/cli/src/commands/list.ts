import { Command } from 'commander';
import chalk from 'chalk';
import { GlobalProjectStore } from '@pottery/core';
import { formatProjectList } from '../output';

export const listCommand = new Command('list')
  .description('List all projects')
  .action(async () => {
    try {
      const store = new GlobalProjectStore();
      const projects = await store.listProjects();

      console.log(chalk.bold('\nProjects:\n'));
      console.log(formatProjectList(projects));
      console.log('');
      console.log(chalk.gray("Use 'pottery serve --project-id <id>' to visualize"));
      console.log('');
    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
