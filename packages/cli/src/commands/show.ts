import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { ProjectStore, Layer } from '@pottery/core';

export const showCommand = new Command('show')
  .description('Show project structure')
  .requiredOption('--project-id <id>', 'Project ID')
  .option('--layer <layer>', 'Filter by layer: narrative, structure, or specification')
  .option('--graph <graph>', 'Filter by graph type (only for structure layer): feature, flow, or both')
  .action(async (options) => {
    try {
      const store = new ProjectStore(options.projectId);

      // Check if project exists
      if (!await store.exists()) {
        console.error(chalk.red(`\n✗ Project ${options.projectId} not found\n`));
        process.exit(1);
      }

      const metadata = await store.loadMetadata();
      
      // Check if this is a layered project
      const isLayered = await store.isLayered();
      
      if (isLayered) {
        // Load layered graph
        const layeredGraph = await store.loadLayeredGraph();
        let layerFilter: Layer | undefined = undefined;
        let graphFilter: 'feature' | 'flow' | 'both' | undefined = undefined;
        
        if (options.layer) {
          const validLayers = [Layer.Narrative, Layer.Structure, Layer.Specification];
          if (validLayers.includes(options.layer as Layer)) {
            layerFilter = options.layer as Layer;
          } else {
            console.error(chalk.red(`\n✗ Invalid layer: ${options.layer}\n`));
            console.error(chalk.gray('Valid layers: narrative, structure, specification\n'));
            process.exit(1);
          }
        }

        // Validate graph filter
        if (options.graph) {
          if (!layerFilter || layerFilter !== Layer.Structure) {
            console.error(chalk.red(`\n✗ --graph option can only be used with --layer structure\n`));
            process.exit(1);
          }
          const validGraphs = ['feature', 'flow', 'both'];
          if (validGraphs.includes(options.graph)) {
            graphFilter = options.graph as 'feature' | 'flow' | 'both';
          } else {
            console.error(chalk.red(`\n✗ Invalid graph: ${options.graph}\n`));
            console.error(chalk.gray('Valid graphs: feature, flow, both\n'));
            process.exit(1);
          }
        } else if (layerFilter === Layer.Structure) {
          // Default to 'both' for structure layer
          graphFilter = 'both';
        }

        console.log('');
        console.log(boxen(
          formatLayeredProject(layeredGraph, layerFilter, graphFilter),
          {
            padding: 1,
            borderColor: 'cyan',
            title: `Project: ${options.projectId} ${metadata.name ? `(${metadata.name})` : ''}`,
            titleAlignment: 'center'
          }
        ));
        console.log('');

        if (!layerFilter) {
          console.log(chalk.gray('Tip: Use --layer <narrative|structure|specification> to filter by layer'));
          console.log(chalk.gray('Tip: Use --graph <feature|flow|both> with --layer structure to filter by graph type'));
          console.log('');
        } else if (layerFilter === Layer.Structure && !options.graph) {
          console.log(chalk.gray('Tip: Use --graph <feature|flow|both> to filter by graph type'));
          console.log('');
        }
      } else {
        // Load regular graph
        const graph = await store.loadGraph();
        
        console.log('');
        console.log(boxen(
          formatRegularProject(graph),
          {
            padding: 1,
            borderColor: 'cyan',
            title: `Project: ${options.projectId} ${metadata.name ? `(${metadata.name})` : ''}`,
            titleAlignment: 'center'
          }
        ));
        console.log('');
      }

    } catch (error: any) {
      console.error(chalk.red('\n✗ Error:'), error.message);
      process.exit(1);
    }
  });

function formatLayeredProject(graph: any, layerFilter?: Layer, graphFilter?: 'feature' | 'flow' | 'both'): string {
  let output = '';

  if (layerFilter) {
    // Show only selected layer
    switch (layerFilter) {
      case Layer.Narrative:
        output += formatNarrativeLayer(graph.narrativeLayer);
        break;
      case Layer.Structure:
        output += formatStructureLayer(graph.structureLayer, graphFilter || 'both');
        break;
      case Layer.Specification:
        output += formatSpecificationLayer(graph.specificationLayer);
        break;
    }
  } else {
    // Show all layers
    output += chalk.bold('📖 Narrative Layer:\n');
    output += formatNarrativeLayer(graph.narrativeLayer);
    output += '\n';
    
    output += chalk.bold('🔗 Structure Layer:\n');
    output += formatStructureLayer(graph.structureLayer, 'both');
    output += '\n';
    
    output += chalk.bold('⚙️  Specification Layer:\n');
    output += formatSpecificationLayer(graph.specificationLayer);
    output += '\n';
    
    output += chalk.bold('🔀 Cross-Layer Dependencies:\n');
    output += chalk.gray(`  ${graph.crossLayerDependencies.size} cross-layer links\n`);
  }

  output += chalk.gray(`\nVersion: ${graph.version}`);
  return output;
}

function formatNarrativeLayer(layer: any): string {
  const epics = Array.from(layer.nodes.values()).filter((n: any) => n.id.startsWith('epic-'));
  const stories = Array.from(layer.nodes.values()).filter((n: any) => n.id.startsWith('story-'));
  
  return chalk.gray(
    `  Epics: ${epics.length}\n` +
    `  User Stories: ${stories.length}\n` +
    `  Dependencies: ${layer.edges.size}\n`
  );
}

function formatStructureLayer(layer: any, graphFilter: 'feature' | 'flow' | 'both'): string {
  const featureNodes = Array.from(layer.featureGraph.nodes.values());
  const flowNodes = Array.from(layer.flowGraph.nodes.values());
  const screens = flowNodes.filter((n: any) => n.id.startsWith('screen-'));
  const actions = flowNodes.filter((n: any) => n.id.startsWith('action-'));
  
  let output = '';
  
  if (graphFilter === 'feature' || graphFilter === 'both') {
    output += chalk.bold('  🔧 Feature Graph:\n');
    output += chalk.gray(
      `    Capabilities: ${featureNodes.length}\n` +
      `    Dependencies: ${layer.featureGraph.edges.size}\n`
    );
    if (graphFilter === 'both') {
      output += '\n';
    }
  }
  
  if (graphFilter === 'flow' || graphFilter === 'both') {
    output += chalk.bold('  🔄 Flow Graph:\n');
    output += chalk.gray(
      `    Screens: ${screens.length}\n` +
      `    Actions: ${actions.length}\n` +
      `    Dependencies: ${layer.flowGraph.edges.size}\n`
    );
  }
  
  return output;
}

function formatSpecificationLayer(layer: any): string {
  const requirements = Array.from(layer.nodes.values()).filter((n: any) => n.id.startsWith('req-'));
  const tasks = Array.from(layer.nodes.values()).filter((n: any) => n.id.startsWith('task-'));
  
  return chalk.gray(
    `  Technical Requirements: ${requirements.length}\n` +
    `  Tasks: ${tasks.length}\n` +
    `  Dependencies: ${layer.edges.size}\n`
  );
}

function formatRegularProject(graph: any): string {
  const nodes = Array.from(graph.nodes.values());
  const intents = nodes.filter((n: any) => n.id.startsWith('intent-'));
  const subIntents = nodes.filter((n: any) => n.id.startsWith('subintent-'));
  const features = nodes.filter((n: any) => n.id.startsWith('feature-'));
  const tasks = nodes.filter((n: any) => n.id.startsWith('task-'));
  const uxSpecs = nodes.filter((n: any) => n.id.startsWith('uxspec-'));

  return chalk.gray(
    `  ProductIntents: ${intents.length}\n` +
    `  SubIntents: ${subIntents.length}\n` +
    `  Features: ${features.length}\n` +
    `  Tasks: ${tasks.length}\n` +
    `  UXSpecs: ${uxSpecs.length}\n` +
    `  Dependencies: ${graph.edges.size}\n` +
    `\nVersion: ${graph.version}`
  );
}

