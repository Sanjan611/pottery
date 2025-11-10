import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { ProjectStore } from '@pottery/core';
import { formatCRSummary } from '../output';

export const changeCommand = new Command('change')
  .description('Create a change request')
  .requiredOption('--project-id <id>', 'Project ID')
  .argument('<description>', 'Change description')
  .action(async (description, options) => {
    const spinner = ora('Analyzing impact...').start();

    try {
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        spinner.fail(`Project ${options.projectId} not found`);
        process.exit(1);
      }

      const graph = await store.loadGraph();

      spinner.text = 'AI analyzing change and generating plan...';

      // For now, create a placeholder CR until BAML is integrated
      // This will be replaced with actual AI analysis
      const cr = await store.createChangeRequest({
        description: description,
        initiator: 'user',
        new_nodes: [],
        modified_nodes: [],
        new_dependencies: [],
        impact_map: []
      });

      spinner.succeed(`Created ChangeRequest: ${chalk.cyan(cr.id)}`);

      // Display CR summary
      console.log('');
      console.log(boxen(
        `${chalk.bold(cr.id + ': ' + description)}\n\n${formatCRSummary(cr, options.projectId)}`,
        { padding: 1, borderColor: 'yellow', title: 'Change Request', titleAlignment: 'center' }
      ));

      console.log('');
      console.log(chalk.bold('Actions:'));
      console.log(chalk.gray(`  pottery cr apply --project-id ${options.projectId} --cr-id ${cr.id}`));
      console.log(chalk.gray(`  pottery cr show --project-id ${options.projectId} --cr-id ${cr.id}`));
      console.log(chalk.gray(`  pottery cr delete --project-id ${options.projectId} --cr-id ${cr.id}`));
      console.log('');

    } catch (error: any) {
      spinner.fail('Failed to create change request');
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
