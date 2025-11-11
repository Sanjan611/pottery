import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { GlobalProjectStore, ProjectStore } from '@pottery/core';

export const deleteCommand = new Command('delete')
  .description('Delete a project or all projects')
  .option('--project-id <id>', 'Project ID to delete')
  .option('--all', 'Delete all projects')
  .action(async (options) => {
    try {
      const globalStore = new GlobalProjectStore();

      // Validate that either --project-id or --all is provided
      if (!options.projectId && !options.all) {
        console.error(chalk.red('\n✗ Error: Must specify either --project-id or --all\n'));
        console.log(chalk.gray('Examples:'));
        console.log(chalk.gray('  pottery delete --project-id proj_123'));
        console.log(chalk.gray('  pottery delete --all\n'));
        process.exit(1);
      }

      // Validate that both options are not provided together
      if (options.projectId && options.all) {
        console.error(chalk.red('\n✗ Error: Cannot use --project-id and --all together\n'));
        process.exit(1);
      }

      // Handle delete all
      if (options.all) {
        const projects = await globalStore.listProjects();

        if (projects.length === 0) {
          console.log(chalk.gray('\nNo projects to delete\n'));
          process.exit(0);
        }

        // Display warning with all projects
        console.log(chalk.yellow.bold('\n⚠️  Warning:'), `This will permanently delete ${chalk.red.bold(`ALL ${projects.length} projects`)}:\n`);

        for (const project of projects) {
          console.log(chalk.gray(`   • ${chalk.cyan(project.project_id)} - ${project.name || '(unnamed)'}`));
        }
        console.log('');

        // Confirm deletion
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const confirmed = await new Promise<boolean>((resolve) => {
          rl.question(chalk.yellow(`Type ${chalk.red.bold('DELETE ALL')} to confirm: `), (answer) => {
            rl.close();
            resolve(answer.trim() === 'DELETE ALL');
          });
        });

        if (!confirmed) {
          console.log(chalk.gray('\nDeletion cancelled\n'));
          process.exit(0);
        }

        // Delete all projects
        const spinner = ora('Deleting all projects...').start();
        for (const project of projects) {
          spinner.text = `Deleting ${project.project_id}...`;
          await globalStore.deleteProject(project.project_id);
        }
        spinner.succeed(chalk.green(`Deleted all ${projects.length} projects`));
        console.log('');
        return;
      }

      // Handle single project deletion
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
