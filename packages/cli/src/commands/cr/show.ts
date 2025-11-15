import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { ProjectStore, Layer } from '@pottery/core';
import { formatCRDetail } from '../../output';
import Table from 'cli-table3';

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
      const isLayered = await store.isLayered();

      let detailText = formatCRDetail(cr);

      // Show impact analysis if available
      if (isLayered && cr.impactAnalysis) {
        detailText += '\n\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        detailText += '\n' + chalk.bold.cyan('📊 Impact Analysis');
        detailText += '\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const impact = cr.impactAnalysis;
        const narrativeNodes = impact.affectedNodes.get(Layer.Narrative) || [];
        const structureNodes = impact.affectedNodes.get(Layer.Structure) || [];
        const specNodes = impact.affectedNodes.get(Layer.Specification) || [];

        detailText += `\n\n${chalk.bold('Affected Nodes by Layer:')}`;
        detailText += `\n  ${chalk.magenta('📖 Narrative:')} ${narrativeNodes.length} node(s)`;
        detailText += `\n  ${chalk.blue('🔗 Structure:')} ${structureNodes.length} node(s)`;
        detailText += `\n  ${chalk.yellow('⚙️  Specification:')} ${specNodes.length} node(s)`;

        if (impact.impactedFlows.length > 0) {
          detailText += `\n  ${chalk.cyan('🔄 Flows:')} ${impact.impactedFlows.length} affected`;
        }
        if (impact.impactedCapabilities.length > 0) {
          detailText += `\n  ${chalk.green('💡 Capabilities:')} ${impact.impactedCapabilities.length} affected`;
        }
        if (impact.impactedRequirements.length > 0) {
          detailText += `\n  ${chalk.yellow('📋 Requirements:')} ${impact.impactedRequirements.length} affected`;
        }
        if (impact.impactedTasks.length > 0) {
          detailText += `\n  ${chalk.yellow('✅ Tasks:')} ${impact.impactedTasks.length} affected`;
        }

        const totalAffected = narrativeNodes.length + structureNodes.length + specNodes.length;
        detailText += `\n\n${chalk.bold(`Total affected nodes: ${totalAffected}`)}`;
      }

      // Show cross-layer changes if available
      if (isLayered && cr.crossLayerChanges) {
        detailText += '\n\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        detailText += '\n' + chalk.bold.cyan('🔀 Cross-Layer Changes');
        detailText += '\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const changes = cr.crossLayerChanges;
        detailText += `\n\n${chalk.bold('Changes by Layer:')}`;
        detailText += `\n  ${chalk.magenta('📖 Narrative:')} ${changes.narrative.length} change(s)`;
        detailText += `\n  ${chalk.blue('🔗 Structure:')} ${changes.structure.length} change(s)`;
        detailText += `\n  ${chalk.yellow('⚙️  Specification:')} ${changes.specification.length} change(s)`;
      }

      console.log('');
      console.log(boxen(
        detailText,
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
        if (isLayered && cr.impactAnalysis) {
          console.log(chalk.gray(`  pottery analyze impact --project-id ${options.projectId} --node-id <node-id>`));
        }
        console.log('');
      }

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });
