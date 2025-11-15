import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectStore, ImpactAnalyzer, Layer } from '@pottery/core';
import Table from 'cli-table3';

const impactCommand = new Command('impact')
  .description('Analyze the impact of changing a node')
  .requiredOption('--project-id <id>', 'Project ID')
  .requiredOption('--node-id <id>', 'Node ID to analyze')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);
      
      if (!(await store.exists())) {
        console.error(chalk.red(`✗ Project "${options.projectId}" not found`));
        process.exit(1);
      }

      if (!(await store.isLayered())) {
        console.error(chalk.red('✗ Impact analysis is only available for layered projects'));
        process.exit(1);
      }

      const graph = await store.loadLayeredGraph();
      const analyzer = new ImpactAnalyzer(graph);

      const impact = analyzer.analyzeImpact(options.nodeId as string);

      // Get node names for display
      const nodeNameMap = new Map<string, string>();
      for (const [id, node] of graph.narrativeLayer.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
        else if ('narrative' in node) nodeNameMap.set(id, (node as any).narrative.substring(0, 50));
      }
      for (const [id, node] of graph.structureLayer.featureGraph.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
      }
      for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
      }
      for (const [id, node] of graph.specificationLayer.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name as string);
        else if ('description' in node) nodeNameMap.set(id, (node as any).description.substring(0, 50));
      }

      const targetName = nodeNameMap.get(options.nodeId as string) || (options.nodeId as string);

      console.log('');
      console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.bold(`Impact Analysis: ${targetName}`));
      console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.gray(`Node ID: ${options.nodeId}`));
      console.log(chalk.gray(`Layer: ${impact.targetLayer}`));
      console.log('');

      // Show affected nodes by layer
      const narrativeNodes = impact.affectedNodes.get(Layer.Narrative) || [];
      const structureNodes = impact.affectedNodes.get(Layer.Structure) || [];
      const specNodes = impact.affectedNodes.get(Layer.Specification) || [];

      if (narrativeNodes.length > 0) {
        console.log(chalk.bold.magenta('📖 Narrative Layer:'));
        const table = new Table({
          head: ['Node ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const nodeId of narrativeNodes) {
          const name = nodeNameMap.get(nodeId) || nodeId;
          table.push([nodeId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (structureNodes.length > 0) {
        console.log(chalk.bold.blue('🔗 Structure Layer:'));
        const table = new Table({
          head: ['Node ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const nodeId of structureNodes) {
          const name = nodeNameMap.get(nodeId) || nodeId;
          table.push([nodeId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (specNodes.length > 0) {
        console.log(chalk.bold.yellow('⚙️  Specification Layer:'));
        const table = new Table({
          head: ['Node ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const nodeId of specNodes) {
          const name = nodeNameMap.get(nodeId) || nodeId;
          table.push([nodeId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      // Show specific impacts
      if (impact.impactedFlows.length > 0) {
        console.log(chalk.bold.cyan('🔄 Impacted Flows:'));
        for (const flowId of impact.impactedFlows) {
          const name = nodeNameMap.get(flowId) || flowId;
          console.log(chalk.cyan(`  • ${name} (${flowId})`));
        }
        console.log('');
      }

      if (impact.impactedCapabilities.length > 0) {
        console.log(chalk.bold.green('💡 Impacted Capabilities:'));
        for (const capId of impact.impactedCapabilities) {
          const name = nodeNameMap.get(capId) || capId;
          console.log(chalk.green(`  • ${name} (${capId})`));
        }
        console.log('');
      }

      if (impact.impactedRequirements.length > 0) {
        console.log(chalk.bold.yellow('📋 Impacted Requirements:'));
        for (const reqId of impact.impactedRequirements) {
          const name = nodeNameMap.get(reqId) || reqId;
          console.log(chalk.yellow(`  • ${name} (${reqId})`));
        }
        console.log('');
      }

      if (impact.impactedTasks.length > 0) {
        console.log(chalk.bold.yellow('✅ Impacted Tasks:'));
        for (const taskId of impact.impactedTasks) {
          const name = nodeNameMap.get(taskId) || taskId;
          console.log(chalk.yellow(`  • ${name} (${taskId})`));
        }
        console.log('');
      }

      // Show cross-layer dependencies
      if (impact.crossLayerDependencies.length > 0) {
        console.log(chalk.bold.white('🔀 Cross-Layer Dependencies:'));
        for (const dep of impact.crossLayerDependencies) {
          const fromName = nodeNameMap.get(dep.fromNodeId) || dep.fromNodeId;
          const toName = nodeNameMap.get(dep.toNodeId) || dep.toNodeId;
          console.log(chalk.white(`  • ${fromName} → ${toName}`));
          if (dep.rationale) {
            console.log(chalk.gray(`    ${dep.rationale}`));
          }
        }
        console.log('');
      }

      const totalAffected = narrativeNodes.length + structureNodes.length + specNodes.length;
      console.log(chalk.bold(`Total affected nodes: ${totalAffected}`));

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

const dependenciesCommand = new Command('dependencies')
  .description('Show cross-layer dependencies for a node')
  .requiredOption('--project-id <id>', 'Project ID')
  .requiredOption('--node-id <id>', 'Node ID')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);
      
      if (!(await store.exists())) {
        console.error(chalk.red(`✗ Project "${options.projectId}" not found`));
        process.exit(1);
      }

      if (!(await store.isLayered())) {
        console.error(chalk.red('✗ Dependency analysis is only available for layered projects'));
        process.exit(1);
      }

      const graph = await store.loadLayeredGraph();
      const analyzer = new ImpactAnalyzer(graph);

      const crossLayerImpact = analyzer.getCrossLayerImpact(options.nodeId);

      // Get node names
      const nodeNameMap = new Map<string, string>();
      for (const [id, node] of graph.narrativeLayer.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
      }
      for (const [id, node] of graph.structureLayer.featureGraph.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
      }
      for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name);
      }
      for (const [id, node] of graph.specificationLayer.nodes) {
        if ('name' in node) nodeNameMap.set(id, node.name as string);
      }

      const targetName = nodeNameMap.get(options.nodeId as string) || (options.nodeId as string);

      console.log('');
      console.log(chalk.bold.cyan(`Cross-Layer Dependencies for: ${targetName}`));
      console.log(chalk.gray(`Node ID: ${options.nodeId}`));
      console.log('');

      if (crossLayerImpact.length === 0) {
        console.log(chalk.yellow('No cross-layer dependencies found'));
        return;
      }

      const table = new Table({
        head: ['Dependency Type', 'From Node', 'To Node', 'Rationale'],
        colWidths: [25, 30, 30, 50]
      });

      for (const dep of graph.crossLayerDependencies.values()) {
        if (dep.fromNodeId === (options.nodeId as string) || dep.toNodeId === (options.nodeId as string)) {
          const fromName = nodeNameMap.get(dep.fromNodeId) || dep.fromNodeId;
          const toName = nodeNameMap.get(dep.toNodeId) || dep.toNodeId;
          table.push([
            dep.type,
            fromName,
            toName,
            dep.rationale || '(no rationale)'
          ]);
        }
      }

      console.log(table.toString());

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

export const analyzeCommand = new Command('analyze')
  .description('Analyze impact and dependencies')
  .addCommand(impactCommand)
  .addCommand(dependenciesCommand);

