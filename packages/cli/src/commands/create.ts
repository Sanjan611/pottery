import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { ProjectStore } from '@pottery/core';
import { Planner } from '@pottery/ai';
import { generateProjectId, formatCRSummary } from '../output';

export const createCommand = new Command('create')
  .description('Create a new project')
  .requiredOption('--intent <description>', 'Product intent description')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const debug = options.debug || false;
    const spinner = ora('Creating new project...').start();

    try {
      // Generate unique project ID
      const projectId = generateProjectId();
      if (debug) console.log(chalk.gray(`\n[DEBUG] Generated project ID: ${projectId}`));

      // Initialize project storage
      const store = new ProjectStore(projectId);
      await store.initialize();
      if (debug) console.log(chalk.gray(`[DEBUG] Initialized project storage at ~/.pottery/projects/${projectId}`));

      spinner.text = 'AI analyzing intent and generating product structure...';
      if (debug) console.log(chalk.gray(`[DEBUG] User intent: "${options.intent}"`));

      // Use AI Planner to generate initial structure
      const planner = new Planner();
      if (debug) console.log(chalk.gray('[DEBUG] Calling BAML CreateProjectStructure...'));

      const crData = await planner.createProject(options.intent);

      if (debug) {
        console.log(chalk.gray(`[DEBUG] AI generation complete:`));
        console.log(chalk.gray(`  - New nodes: ${crData.new_nodes?.length || 0}`));
        console.log(chalk.gray(`  - New dependencies: ${crData.new_dependencies?.length || 0}`));

        if (crData.new_nodes && crData.new_nodes.length > 0) {
          const nodeTypes = {
            intent: crData.new_nodes.filter(n => n.id.startsWith('intent-')).length,
            subintent: crData.new_nodes.filter(n => n.id.startsWith('subintent-')).length,
            feature: crData.new_nodes.filter(n => n.id.startsWith('feature-')).length,
            task: crData.new_nodes.filter(n => n.id.startsWith('task-')).length,
            uxspec: crData.new_nodes.filter(n => n.id.startsWith('uxspec-')).length,
          };
          console.log(chalk.gray(`  - Node breakdown:`));
          console.log(chalk.gray(`    • ProductIntents: ${nodeTypes.intent}`));
          console.log(chalk.gray(`    • SubIntents: ${nodeTypes.subintent}`));
          console.log(chalk.gray(`    • Features: ${nodeTypes.feature}`));
          console.log(chalk.gray(`    • Tasks: ${nodeTypes.task}`));
          console.log(chalk.gray(`    • UXSpecs: ${nodeTypes.uxspec}`));
        }
      }

      // Create CR-000 with AI-generated structure
      const cr = await store.createChangeRequest({
        description: 'Initial project structure',
        initiator: 'ai',
        ...crData
      });

      if (debug) console.log(chalk.gray(`[DEBUG] Created CR-000 at ${projectId}/change-requests/CR-000.json`));

      spinner.succeed(`Created project: ${chalk.cyan(projectId)}`);

      // Display summary
      console.log('');
      console.log(boxen(
        `${chalk.bold(`CR-${cr.id.split('-')[1]}: Initial project structure`)}\n\n${formatCRSummary(cr, projectId)}`,
        { padding: 1, borderColor: 'cyan', title: 'Project Created', titleAlignment: 'center' }
      ));

      console.log('');
      console.log(chalk.bold(`📋 Project ID: ${chalk.cyan(projectId)}`));
      console.log('');
      console.log(chalk.bold('Review and apply:'));
      console.log(chalk.gray(`  pottery cr show --project-id ${projectId} --cr-id CR-000`));
      console.log(chalk.gray(`  pottery cr apply --project-id ${projectId} --cr-id CR-000`));
      console.log('');
      console.log(chalk.bold('Or delete if not satisfied:'));
      console.log(chalk.gray(`  pottery delete --project-id ${projectId}`));
      console.log('');

    } catch (error: any) {
      spinner.fail('Failed to create project');
      console.error(chalk.red('\n✗ Error:'), error.message);

      if (debug) {
        console.error(chalk.gray('\n[DEBUG] Full error stack:'));
        console.error(chalk.gray(error.stack));
      }

      // Provide helpful hints for common errors
      if (error.message.includes('API key') || error.message.includes('unauthorized')) {
        console.error(chalk.yellow('\n💡 Hint: Make sure your OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable is set.'));
        console.error(chalk.gray('   Example: export OPENAI_API_KEY=sk-...'));
      }

      process.exit(1);
    }
  });
