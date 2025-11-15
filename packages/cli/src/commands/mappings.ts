import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectStore } from '@pottery/core';
import Table from 'cli-table3';

const listMappingsCommand = new Command('list')
  .description('List all mappings in a project')
  .requiredOption('--project-id <id>', 'Project ID')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);
      
      if (!(await store.exists())) {
        console.error(chalk.red(`✗ Project "${options.projectId}" not found`));
        process.exit(1);
      }

      if (!(await store.isLayered())) {
        console.error(chalk.red('✗ Mappings are only available for layered projects'));
        process.exit(1);
      }

      const graph = await store.loadLayeredGraph();
      const mappings = Array.from(graph.structureLayer.mappings.values());

      if (mappings.length === 0) {
        console.log(chalk.yellow('No mappings found in this project'));
        return;
      }

      // Get node names for display
      const flowActionMap = new Map<string, string>();
      const capabilityMap = new Map<string, string>();

      for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
        if (id.startsWith('action-') && 'name' in node) {
          flowActionMap.set(id, node.name);
        }
      }

      for (const [id, node] of graph.structureLayer.featureGraph.nodes) {
        if ('name' in node) {
          capabilityMap.set(id, node.name);
        }
      }

      // Create table
      const table = new Table({
        head: ['Mapping ID', 'Flow Action', 'Capabilities', 'Rationale'],
        colWidths: [20, 30, 40, 60]
      });

      for (const mapping of mappings) {
        const actionName = flowActionMap.get(mapping.flowActionId) || mapping.flowActionId;
        const capabilityNames = mapping.capabilityIds
          .map(id => capabilityMap.get(id) || id)
          .join(', ');
        const rationale = mapping.rationale.length > 55
          ? mapping.rationale.substring(0, 52) + '...'
          : mapping.rationale;

        table.push([
          mapping.id,
          actionName,
          capabilityNames || '(none)',
          rationale || '(no rationale)'
        ]);
      }

      console.log('');
      console.log(chalk.bold(`Mappings for project: ${options.projectId}`));
      console.log(table.toString());
      console.log(`\nTotal: ${mappings.length} mapping(s)`);

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

const analyzeMappingsCommand = new Command('analyze')
  .description('Analyze mappings for a specific node')
  .requiredOption('--project-id <id>', 'Project ID')
  .option('--flow-action-id <id>', 'Show capabilities required by a flow action')
  .option('--capability-id <id>', 'Show flow actions that use a capability')
  .option('--screen-id <id>', 'Show all mappings for actions on a screen')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);
      
      if (!(await store.exists())) {
        console.error(chalk.red(`✗ Project "${options.projectId}" not found`));
        process.exit(1);
      }

      if (!(await store.isLayered())) {
        console.error(chalk.red('✗ Mappings are only available for layered projects'));
        process.exit(1);
      }

      const graph = await store.loadLayeredGraph();
      const mappings = Array.from(graph.structureLayer.mappings.values());

      // Get node names for display
      const flowActionMap = new Map<string, any>();
      const capabilityMap = new Map<string, any>();
      const screenMap = new Map<string, any>();

      for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
        if (id.startsWith('action-')) {
          flowActionMap.set(id, node);
        } else if (id.startsWith('screen-')) {
          screenMap.set(id, node);
        }
      }

      for (const [id, node] of graph.structureLayer.featureGraph.nodes) {
        capabilityMap.set(id, node);
      }

      if (options.flowActionId) {
        // Show capabilities required by a flow action
        const actionNode = flowActionMap.get(options.flowActionId);
        if (!actionNode) {
          console.error(chalk.red(`✗ Flow action "${options.flowActionId}" not found`));
          process.exit(1);
        }

        const actionMappings = mappings.filter(m => m.flowActionId === options.flowActionId);
        
        if (actionMappings.length === 0) {
          console.log(chalk.yellow(`No mappings found for flow action "${actionNode.name}"`));
          return;
        }

        console.log('');
        console.log(chalk.bold(`Flow Action: ${actionNode.name}`));
        console.log(chalk.gray(`  ID: ${options.flowActionId}`));
        console.log(chalk.gray(`  Description: ${actionNode.description || '(no description)'}`));
        console.log('');

        for (const mapping of actionMappings) {
          console.log(chalk.bold('Required Capabilities:'));
          for (const capabilityId of mapping.capabilityIds) {
            const capNode = capabilityMap.get(capabilityId);
            if (capNode) {
              console.log(`  • ${capNode.name} (${capabilityId})`);
              console.log(chalk.gray(`    ${capNode.description || '(no description)'}`));
            } else {
              console.log(`  • ${capabilityId} (not found)`);
            }
          }
          console.log('');
          console.log(chalk.bold('Rationale:'));
          console.log(chalk.gray(`  ${mapping.rationale || '(no rationale)'}`));
          console.log('');
        }

      } else if (options.capabilityId) {
        // Show flow actions that use a capability
        const capNode = capabilityMap.get(options.capabilityId);
        if (!capNode) {
          console.error(chalk.red(`✗ Capability "${options.capabilityId}" not found`));
          process.exit(1);
        }

        const capabilityMappings = mappings.filter(m => 
          m.capabilityIds.includes(options.capabilityId)
        );

        if (capabilityMappings.length === 0) {
          console.log(chalk.yellow(`No flow actions use capability "${capNode.name}"`));
          return;
        }

        console.log('');
        console.log(chalk.bold(`Capability: ${capNode.name}`));
        console.log(chalk.gray(`  ID: ${options.capabilityId}`));
        console.log(chalk.gray(`  Description: ${capNode.description || '(no description)'}`));
        console.log('');
        console.log(chalk.bold(`Used by ${capabilityMappings.length} flow action(s):`));
        console.log('');

        for (const mapping of capabilityMappings) {
          const actionNode = flowActionMap.get(mapping.flowActionId);
          if (actionNode) {
            console.log(`  • ${actionNode.name} (${mapping.flowActionId})`);
            console.log(chalk.gray(`    ${actionNode.description || '(no description)'}`));
            console.log(chalk.gray(`    Rationale: ${mapping.rationale || '(no rationale)'}`));
            console.log('');
          }
        }

      } else if (options.screenId) {
        // Show all mappings for actions on a screen
        const screenNode = screenMap.get(options.screenId);
        if (!screenNode) {
          console.error(chalk.red(`✗ Screen "${options.screenId}" not found`));
          process.exit(1);
        }

        const actionIds = screenNode.actions || [];
        const screenMappings = mappings.filter(m => 
          actionIds.includes(m.flowActionId)
        );

        if (screenMappings.length === 0) {
          console.log(chalk.yellow(`No mappings found for actions on screen "${screenNode.name}"`));
          return;
        }

        console.log('');
        console.log(chalk.bold(`Screen: ${screenNode.name}`));
        console.log(chalk.gray(`  ID: ${options.screenId}`));
        console.log(chalk.gray(`  Description: ${screenNode.description || '(no description)'}`));
        console.log('');
        console.log(chalk.bold(`Mappings for ${screenMappings.length} action(s):`));
        console.log('');

        for (const mapping of screenMappings) {
          const actionNode = flowActionMap.get(mapping.flowActionId);
          if (actionNode) {
            console.log(`  Flow Action: ${actionNode.name}`);
            console.log(chalk.gray(`    ID: ${mapping.flowActionId}`));
            console.log(chalk.bold('    Required Capabilities:'));
            for (const capabilityId of mapping.capabilityIds) {
              const capNode = capabilityMap.get(capabilityId);
              if (capNode) {
                console.log(`      • ${capNode.name}`);
              } else {
                console.log(`      • ${capabilityId} (not found)`);
              }
            }
            console.log(chalk.gray(`    Rationale: ${mapping.rationale || '(no rationale)'}`));
            console.log('');
          }
        }

      } else {
        console.error(chalk.red('✗ Please specify --flow-action-id, --capability-id, or --screen-id'));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

export const mappingsCommand = new Command('mappings')
  .description('View and analyze flow-to-capability mappings')
  .addCommand(listMappingsCommand)
  .addCommand(analyzeMappingsCommand);
