import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectStore, ImpactAnalyzer } from '@pottery/core';
import Table from 'cli-table3';

const traceCommand = new Command('trace')
  .description('Trace dependencies from narrative to implementation or vice versa')
  .requiredOption('--project-id <id>', 'Project ID')
  .requiredOption('--from <id>', 'Starting node ID (Epic ID or Task ID)')
  .option('--reverse', 'Trace from implementation to narrative (use with Task ID)')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);
      
      if (!(await store.exists())) {
        console.error(chalk.red(`✗ Project "${options.projectId}" not found`));
        process.exit(1);
      }

      if (!(await store.isLayered())) {
        console.error(chalk.red('✗ Trace is only available for layered projects'));
        process.exit(1);
      }

      const graph = await store.loadLayeredGraph();
      const analyzer = new ImpactAnalyzer(graph);

      const fromNodeId = options.from as string;

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

      let trace;
      if (options.reverse) {
        // Trace from task to epic
        trace = analyzer.traceImplementationToNarrative(fromNodeId);
      } else {
        // Trace from epic to tasks
        trace = analyzer.traceNarrativeToImplementation(fromNodeId);
      }

      console.log('');
      console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      if (options.reverse) {
        console.log(chalk.bold(`Trace: Implementation → Narrative`));
      } else {
        console.log(chalk.bold(`Trace: Narrative → Implementation`));
      }
      console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log('');

      // Show path
      console.log(chalk.bold('📊 Dependency Path:'));
      const pathNames = trace.path.map(id => {
        const name = nodeNameMap.get(id) || id;
        return `${name} (${id})`;
      });
      console.log(chalk.white(pathNames.join(' → ')));
      console.log('');

      // Show breakdown by type
      if (trace.epicId) {
        const epicName = nodeNameMap.get(trace.epicId) || trace.epicId;
        console.log(chalk.bold.magenta(`📖 Epic: ${epicName}`));
        console.log('');
      }

      if (trace.userStories.length > 0) {
        console.log(chalk.bold.magenta('📖 User Stories:'));
        const table = new Table({
          head: ['Story ID', 'Narrative'],
          colWidths: [25, 60]
        });
        for (const storyId of trace.userStories) {
          const name = nodeNameMap.get(storyId) || storyId;
          table.push([storyId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (trace.capabilities.length > 0) {
        console.log(chalk.bold.green('💡 Capabilities:'));
        const table = new Table({
          head: ['Capability ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const capId of trace.capabilities) {
          const name = nodeNameMap.get(capId) || capId;
          table.push([capId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (trace.flowActions.length > 0) {
        console.log(chalk.bold.blue('🔄 Flow Actions:'));
        const table = new Table({
          head: ['Action ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const actionId of trace.flowActions) {
          const name = nodeNameMap.get(actionId) || actionId;
          table.push([actionId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (trace.requirements.length > 0) {
        console.log(chalk.bold.yellow('📋 Technical Requirements:'));
        const table = new Table({
          head: ['Requirement ID', 'Name'],
          colWidths: [25, 60]
        });
        for (const reqId of trace.requirements) {
          const name = nodeNameMap.get(reqId) || reqId;
          table.push([reqId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      if (trace.tasks.length > 0) {
        console.log(chalk.bold.yellow('✅ Tasks:'));
        const table = new Table({
          head: ['Task ID', 'Description'],
          colWidths: [25, 60]
        });
        for (const taskId of trace.tasks) {
          const name = nodeNameMap.get(taskId) || taskId;
          table.push([taskId, name]);
        }
        console.log(table.toString());
        console.log('');
      }

      // Summary
      const totalNodes = trace.userStories.length + 
                        trace.capabilities.length + 
                        trace.flowActions.length + 
                        trace.requirements.length + 
                        trace.tasks.length;
      console.log(chalk.bold(`Total nodes in trace: ${totalNodes}`));

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

export { traceCommand };

