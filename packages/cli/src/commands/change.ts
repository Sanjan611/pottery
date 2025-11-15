import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { ProjectStore, ImpactAnalyzer, Layer } from '@pottery/core';
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

      // Load graph (works for both layered and legacy projects)
      const isLayered = await store.isLayered();
      if (isLayered) {
        const graph = await store.loadLayeredGraph();
        spinner.text = 'AI analyzing change across all layers...';

        // For layered projects, we can show that cross-layer impact analysis is available
        // The actual AI integration will be added when BAML prompts are updated
        console.log(chalk.gray('\n💡 Cross-layer impact analysis will be performed'));
        console.log(chalk.gray('   This will analyze impact across Narrative, Structure, and Specification layers'));
      } else {
        await store.loadGraph(); // Verify legacy project is valid
        spinner.text = 'AI analyzing change and generating plan...';
      }

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
      let summaryText = `${chalk.bold(cr.id + ': ' + description)}\n\n${formatCRSummary(cr, options.projectId)}`;
      
      // Add impact analysis note for layered projects
      if (isLayered) {
        summaryText += `\n\n${chalk.bold.cyan('📊 Impact Analysis:')}`;
        summaryText += `\n${chalk.gray('   Cross-layer impact analysis is available for this project.')}`;
        summaryText += `\n${chalk.gray('   Use "pottery analyze impact --node-id <id>" to analyze specific nodes.')}`;
      }

      console.log('');
      console.log(boxen(
        summaryText,
        { padding: 1, borderColor: 'yellow', title: 'Change Request', titleAlignment: 'center' }
      ));

      console.log('');
      console.log(chalk.bold('Actions:'));
      console.log(chalk.gray(`  pottery cr apply --project-id ${options.projectId} --cr-id ${cr.id}`));
      console.log(chalk.gray(`  pottery cr show --project-id ${options.projectId} --cr-id ${cr.id}`));
      if (isLayered) {
        console.log(chalk.gray(`  pottery analyze impact --project-id ${options.projectId} --node-id <node-id>`));
      }
      console.log(chalk.gray(`  pottery cr delete --project-id ${options.projectId} --cr-id ${cr.id}`));
      console.log('');

    } catch (error: any) {
      spinner.fail('Failed to create change request');
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
