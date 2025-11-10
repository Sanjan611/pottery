# Technical Implementation Plan

**Product:** Pottery MVP
**Version:** 1.0
**Last Updated:** 2025-11-10

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Domain Models](#core-domain-models)
4. [CLI Implementation](#cli-implementation)
5. [AI Planning with BAML](#ai-planning-with-baml)
6. [Storage Layer](#storage-layer)
7. [Web UI Implementation](#web-ui-implementation)
8. [Implementation Phases](#implementation-phases)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## Technology Stack

### Core Runtime
- **Node.js (TypeScript)** - Primary runtime for CLI and server
  - Type safety across the entire codebase
  - Rich ecosystem for CLI and web development
  - Excellent async/await support for AI API calls

### CLI Framework
- **Commander.js** - Command-line argument parsing
  - Clean API for defining commands and options
  - Built-in help generation
  - Supports subcommands naturally

### AI Integration
- **BAML (Boundary ML)** - Typed LLM interactions
  - Type-safe schema definitions for all entities
  - Structured output parsing with validation
  - Version control for prompts
  - Multiple LLM provider support (OpenAI, Anthropic)

### Web Framework
- **Next.js 14+** (App Router)
  - Server-side rendering for initial graph load
  - API routes for data fetching
  - Built-in optimization

### Graph Visualization
- **React Flow** - Interactive graph visualization
  - Built for React
  - Performant with large graphs (100+ nodes)
  - Rich interaction API (zoom, pan, select)
  - Custom node rendering support

### Storage
- **Filesystem (JSON)** - As per MVP spec
  - Simple, no database setup required
  - Easy debugging and inspection
  - Version control friendly

### Styling
- **Tailwind CSS** - Utility-first styling
  - Fast development
  - Consistent design system
  - Small bundle size

---

## Project Structure

```
pottery/
├── packages/
│   ├── cli/                    # CLI application
│   │   ├── src/
│   │   │   ├── commands/       # Command implementations
│   │   │   │   ├── create.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── delete.ts
│   │   │   │   ├── change.ts
│   │   │   │   ├── cr/         # CR subcommands
│   │   │   │   └── serve/      # Server subcommands
│   │   │   ├── output/         # CLI output formatters
│   │   │   └── index.ts        # Main CLI entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core/                   # Core domain logic (shared)
│   │   ├── src/
│   │   │   ├── models/         # TypeScript types
│   │   │   │   ├── ProductIntent.ts
│   │   │   │   ├── SubIntent.ts
│   │   │   │   ├── Feature.ts
│   │   │   │   ├── Task.ts
│   │   │   │   ├── UXSpec.ts
│   │   │   │   ├── Dependency.ts
│   │   │   │   ├── ChangeRequest.ts
│   │   │   │   └── Graph.ts
│   │   │   ├── storage/        # Storage layer
│   │   │   │   ├── ProjectStore.ts
│   │   │   │   ├── GraphStore.ts
│   │   │   │   └── CRStore.ts
│   │   │   ├── validation/     # Business logic validation
│   │   │   │   ├── dag.ts      # DAG cycle detection
│   │   │   │   ├── dependency.ts
│   │   │   │   └── versioning.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai/                     # BAML AI integration
│   │   ├── baml_src/           # BAML definitions
│   │   │   ├── main.baml       # Schema definitions
│   │   │   ├── prompts/        # Prompt templates
│   │   │   │   ├── create_project.baml
│   │   │   │   ├── analyze_change.baml
│   │   │   │   └── decompose_tasks.baml
│   │   │   └── types/          # BAML type definitions
│   │   │       ├── entities.baml
│   │   │       └── change_request.baml
│   │   ├── src/
│   │   │   ├── planner.ts      # High-level planning logic
│   │   │   ├── impact.ts       # Impact analysis
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Web UI (Next.js)
│       ├── src/
│       │   ├── app/            # Next.js app router
│       │   │   ├── page.tsx    # Home (project list)
│       │   │   ├── projects/
│       │   │   │   └── [projectId]/
│       │   │   │       ├── page.tsx
│       │   │   │       └── layout.tsx
│       │   │   └── api/        # API routes
│       │   │       └── projects/
│       │   │           └── [projectId]/
│       │   │               ├── graph/route.ts
│       │   │               └── crs/route.ts
│       │   ├── components/     # React components
│       │   │   ├── graph/
│       │   │   │   ├── GraphView.tsx
│       │   │   │   ├── NodeDetail.tsx
│       │   │   │   └── nodes/
│       │   │   │       ├── IntentNode.tsx
│       │   │   │       ├── FeatureNode.tsx
│       │   │   │       └── TaskNode.tsx
│       │   │   ├── cr/
│       │   │   │   ├── CRList.tsx
│       │   │   │   └── CRDetail.tsx
│       │   │   └── history/
│       │   │       └── VersionHistory.tsx
│       │   └── lib/
│       │       └── api-client.ts
│       ├── public/
│       ├── package.json
│       └── next.config.js
│
├── package.json                # Root package.json (monorepo)
├── pnpm-workspace.yaml         # PNPM workspace config
├── tsconfig.json               # Root TypeScript config
└── turbo.json                  # Turborepo config (optional)
```

**Why Monorepo:**
- Shared types between CLI, AI, and Web
- Atomic changes across packages
- Easier dependency management
- Single version control

**Package Manager: PNPM**
- Fast and efficient
- Native workspace support
- Strict dependency resolution

---

## Core Domain Models

### TypeScript Types (packages/core/src/models/)

All entities should be defined as TypeScript interfaces with:
- Strict typing
- Version information
- Timestamp metadata
- Validation helpers

**Example Structure (ProductIntent.ts):**
```typescript
export interface ProductIntent {
  id: string;                    // Format: "intent-<uuid>"
  name: string;
  description: string;
  version: string;               // Semver: "1.0.0"
  linked_sub_intents: string[];  // SubIntent IDs
  linked_features: string[];     // Feature IDs
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}

export interface SubIntent {
  id: string;                    // Format: "subintent-<uuid>"
  parent_intent: string;         // ProductIntent ID
  name: string;
  description: string;
  version: string;
  linked_features: string[];
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;                    // Format: "feature-<uuid>"
  name: string;
  description: string;
  version: string;
  linked_intent: string;         // SubIntent ID
  linked_tasks: string[];        // Task IDs
  ux_spec?: string;              // UXSpec ID (optional)
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;                    // Format: "task-<uuid>"
  parent_feature: string;        // Feature ID
  type: TaskType;
  description: string;
  version: string;
  dependencies: string[];        // Dependency IDs
  created_at: string;
  updated_at: string;
}

export enum TaskType {
  Backend = "backend",
  Frontend = "frontend",
  Test = "test",
  Infrastructure = "infra"
}

export interface UXSpec {
  id: string;                    // Format: "uxspec-<uuid>"
  linked_feature: string;        // Feature ID
  experience_goal: string;
  design_refs: string[];         // URLs or file paths
  created_at: string;
}

export interface Dependency {
  id: string;                    // Format: "dep-<uuid>"
  from_id: string;               // Source node ID
  to_id: string;                 // Target node ID
  type: DependencyType;
  created_at: string;
}

export enum DependencyType {
  Requires = "requires",
  Blocks = "blocks",
  Impacts = "impacts",
  Supersedes = "supersedes"
}

export interface ChangeRequest {
  id: string;                    // Format: "CR-XXX"
  project_id: string;
  initiator: "user" | "ai";
  description: string;
  status: CRStatus;
  new_nodes: GraphNode[];        // Nodes to create
  modified_nodes: NodeModification[];  // Nodes to update
  new_dependencies: Dependency[];
  impact_map: ImpactMapEntry[];
  created_at: string;
  applied_at?: string;
}

export enum CRStatus {
  Pending = "pending",
  Applied = "applied"
}

export interface NodeModification {
  node_id: string;
  old_version: string;
  new_version: string;
  changes: Record<string, any>;  // Field-level changes
}

export interface ImpactMapEntry {
  node_id: string;
  node_type: string;
  impact_type: "aligned" | "impacts" | "conflicts";
  reason: string;
}

export type GraphNode = ProductIntent | SubIntent | Feature | Task | UXSpec;

export interface Graph {
  version: string;               // "v0", "v1", etc.
  nodes: Map<string, GraphNode>;
  edges: Map<string, Dependency>;
  metadata: {
    created_at: string;
    last_modified: string;
  };
}
```

### Validation Layer (packages/core/src/validation/)

**DAG Validation:**
```typescript
// dag.ts
export class DAGValidator {
  // Detect cycles using depth-first search
  static detectCycle(graph: Graph): string[] | null;

  // Check if adding edge would create cycle
  static wouldCreateCycle(
    graph: Graph,
    from: string,
    to: string
  ): boolean;

  // Get topological sort of graph
  static topologicalSort(graph: Graph): string[];
}
```

**Dependency Validation:**
```typescript
// dependency.ts
export class DependencyValidator {
  // Validate dependency based on type-specific rules
  static validate(
    dependency: Dependency,
    graph: Graph
  ): ValidationResult;

  // Check if "requires" target exists and not deprecated
  static validateRequires(dep: Dependency, graph: Graph): boolean;

  // Check if "supersedes" nodes are same type
  static validateSupersedes(dep: Dependency, graph: Graph): boolean;
}
```

---

## CLI Implementation

### Command Structure (packages/cli/src/commands/)

**Technology Choice:**
- **Commander.js** for argument parsing
- **Chalk** for colored output
- **Ora** for spinners
- **Boxen** for bordered boxes
- **cli-table3** for tables

**Main Entry (index.ts):**
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { deleteCommand } from './commands/delete';
import { changeCommand } from './commands/change';
import { crCommand } from './commands/cr';
import { serveCommand } from './commands/serve';

const program = new Command();

program
  .name('pottery')
  .description('A planning framework for autonomous software agents')
  .version('1.0.0');

program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(deleteCommand);
program.addCommand(changeCommand);
program.addCommand(crCommand);
program.addCommand(serveCommand);

program.parse();
```

**Create Command (commands/create.ts):**
```typescript
import { Command } from 'commander';
import ora from 'ora';
import boxen from 'boxen';
import chalk from 'chalk';
import { ProjectStore } from '@pottery/core';
import { Planner } from '@pottery/ai';

export const createCommand = new Command('create')
  .description('Create a new project')
  .requiredOption('--intent <description>', 'Product intent description')
  .action(async (options) => {
    const spinner = ora('Creating new project...').start();

    try {
      // Generate unique project ID
      const projectId = generateProjectId();

      // Initialize project storage
      const store = new ProjectStore(projectId);
      await store.initialize();

      spinner.text = 'AI analyzing intent and generating product structure...';

      // Use BAML to generate initial structure
      const planner = new Planner();
      const initialStructure = await planner.createProject(options.intent);

      // Create CR-000 (initial structure)
      const cr = await store.createChangeRequest({
        description: 'Initial project structure',
        ...initialStructure
      });

      spinner.succeed(`Created project: ${chalk.cyan(projectId)}`);

      // Display summary
      console.log(boxen(
        formatCRSummary(cr, projectId),
        { padding: 1, borderColor: 'cyan' }
      ));

      // Show next steps
      console.log('\n' + chalk.bold('Review and apply:'));
      console.log(`  pottery cr show --project-id ${projectId} --cr-id CR-000`);
      console.log(`  pottery cr apply --project-id ${projectId} --cr-id CR-000`);

    } catch (error) {
      spinner.fail('Failed to create project');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

function generateProjectId(): string {
  // Generate format: proj_<8-char-random>
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'proj_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function formatCRSummary(cr: ChangeRequest, projectId: string): string {
  // Format the CR summary box
  // See USER_INTERFACE.md for exact format
}
```

**Change Command (commands/change.ts):**
```typescript
import { Command } from 'commander';
import ora from 'ora';
import { ProjectStore } from '@pottery/core';
import { Planner } from '@pottery/ai';

export const changeCommand = new Command('change')
  .description('Create a change request')
  .requiredOption('--project-id <id>', 'Project ID')
  .argument('<description>', 'Change description')
  .action(async (description, options) => {
    const spinner = ora('Analyzing impact...').start();

    try {
      const store = new ProjectStore(options.projectId);
      const graph = await store.loadGraph();

      // Use BAML to analyze change and generate CR
      const planner = new Planner();
      const changeAnalysis = await planner.analyzeChange(
        graph,
        description
      );

      // Create CR
      const cr = await store.createChangeRequest(changeAnalysis);

      spinner.succeed(`Created ChangeRequest: ${chalk.cyan(cr.id)}`);

      // Display CR summary
      console.log(boxen(
        formatCRSummary(cr, options.projectId),
        { padding: 1, borderColor: 'yellow' }
      ));

      // Show actions
      console.log('\n' + chalk.bold('Actions:'));
      console.log(`  pottery cr apply --project-id ${options.projectId} --cr-id ${cr.id}`);
      console.log(`  pottery cr show --project-id ${options.projectId} --cr-id ${cr.id}`);
      console.log(`  pottery cr delete --project-id ${options.projectId} --cr-id ${cr.id}`);

    } catch (error) {
      spinner.fail('Failed to create change request');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });
```

**CR Subcommands (commands/cr/index.ts):**
```typescript
import { Command } from 'commander';

export const crCommand = new Command('cr')
  .description('Manage change requests');

// Add subcommands
crCommand.addCommand(listCRCommand);
crCommand.addCommand(showCRCommand);
crCommand.addCommand(applyCRCommand);
crCommand.addCommand(deleteCRCommand);
```

**Serve Commands (commands/serve/index.ts):**
```typescript
import { Command } from 'commander';
import { spawn } from 'child_process';
import open from 'open';

export const serveCommand = new Command('serve')
  .description('Manage web UI server')
  .argument('[action]', 'Action: start, stop, list', 'start')
  .option('--project-id <id>', 'Project ID (required for start)')
  .option('--port <port>', 'Port number', '3000')
  .action(async (action, options) => {
    switch (action) {
      case 'start':
        await startServer(options);
        break;
      case 'stop':
        await stopServer(options);
        break;
      case 'list':
        await listServers();
        break;
    }
  });

async function startServer(options) {
  // Start Next.js server in background
  const serverProcess = spawn('node', [
    'path/to/web/server.js',
    '--project-id', options.projectId,
    '--port', options.port
  ], {
    detached: true,
    stdio: 'ignore'
  });

  serverProcess.unref();

  // Save PID for later stopping
  await saveServerPID(options.port, serverProcess.pid);

  console.log(chalk.green('✓') + ' Server running at ' +
    chalk.cyan(`http://localhost:${options.port}`));
  console.log(`  Project: ${options.projectId}`);
  console.log(`  PID: ${serverProcess.pid}`);

  // Open browser
  console.log('\nOpening browser...');
  await open(`http://localhost:${options.port}/projects/${options.projectId}`);
}
```

### Output Formatting (packages/cli/src/output/)

Create utility functions for consistent output:
- Box formatting for CRs
- Table formatting for lists
- Tree formatting for hierarchies
- Progress indicators
- Error formatting

---

## AI Planning with BAML

### Why BAML?

**Benefits:**
1. **Type Safety**: Generated TypeScript types match BAML schemas exactly
2. **Structured Output**: Guaranteed to parse correctly or error
3. **Version Control**: Prompts are versioned alongside code
4. **Multi-Provider**: Easy to switch between OpenAI, Anthropic, etc.
5. **Testing**: Built-in testing for prompts
6. **Observability**: Automatic logging and tracing

### BAML Setup (packages/ai/)

**Installation:**
```bash
cd packages/ai
npm install @boundaryml/baml
```

**Project Structure:**
```
packages/ai/
├── baml_src/
│   ├── main.baml           # Entry point
│   ├── types/
│   │   └── entities.baml   # Type definitions
│   └── prompts/
│       ├── create_project.baml
│       ├── analyze_change.baml
│       └── decompose_tasks.baml
├── src/
│   ├── baml_client/        # Auto-generated by BAML
│   ├── planner.ts          # High-level API
│   └── impact.ts           # Impact analysis
└── package.json
```

### BAML Type Definitions (baml_src/types/entities.baml)

```python
# Define all core entities as BAML types
class ProductIntent {
  name string
  description string
  sub_intents SubIntent[]
  features Feature[]
}

class SubIntent {
  name string
  description string
  features Feature[]
}

class Feature {
  name string
  description string
  linked_intent string  # SubIntent name
  tasks Task[]
  ux_spec UXSpec?
}

class Task {
  type TaskType
  description string
  dependencies string[]  # Task descriptions they depend on
}

enum TaskType {
  Backend
  Frontend
  Test
  Infrastructure
}

class UXSpec {
  experience_goal string
  design_refs string[]
}

class Dependency {
  from_description string
  to_description string
  type DependencyType
}

enum DependencyType {
  Requires
  Blocks
  Impacts
  Supersedes
}

class ChangeRequestPlan {
  description string
  new_features Feature[]
  modified_features FeatureModification[]
  new_tasks Task[]
  modified_tasks TaskModification[]
  impact_analysis ImpactAnalysis
}

class FeatureModification {
  feature_name string
  reason string
  new_tasks Task[]
  updated_tasks TaskUpdate[]
}

class TaskModification {
  task_description string
  modification_reason string
  new_description string?
  new_dependencies string[]?
}

class ImpactAnalysis {
  affected_features string[]
  affected_tasks string[]
  reasoning string
  risk_level RiskLevel
}

enum RiskLevel {
  Low
  Medium
  High
}
```

### BAML Prompts

**Create Project (baml_src/prompts/create_project.baml):**
```python
function CreateProjectStructure(user_intent: string) -> ProductIntent {
  client GPT4

  prompt #"
    You are a product architect helping to design a software product.

    The user has provided this product intent:
    {{ user_intent }}

    Your task is to:
    1. Create a clear ProductIntent with a concise name and description
    2. Break it down into 2-5 strategic SubIntents (pillars like "User Experience", "Scalability", "Security")
    3. For each SubIntent, generate 2-6 Features (distinct user-facing capabilities)
    4. For each Feature, generate 3-10 Tasks (atomic units of work)
    5. Add UXSpecs where relevant for user-facing features

    Guidelines:
    - Tasks should be actionable and specific
    - Task types: Backend, Frontend, Test, Infrastructure
    - Dependencies should be realistic (a task can depend on other tasks)
    - Keep descriptions clear and concise
    - Focus on the MVP scope

    Return a complete ProductIntent structure.
  "#
}
```

**Analyze Change (baml_src/prompts/analyze_change.baml):**
```python
function AnalyzeChange(
  current_graph: string,  # JSON representation of current graph
  change_description: string
) -> ChangeRequestPlan {
  client GPT4

  prompt #"
    You are analyzing a proposed change to an existing product.

    Current product structure:
    {{ current_graph }}

    Requested change:
    {{ change_description }}

    Your task is to:
    1. Determine what new Features and Tasks need to be created
    2. Identify existing Features and Tasks that need modification
    3. Analyze the impact across the product graph
    4. Determine new dependencies that need to be created

    Guidelines:
    - Be thorough in impact analysis
    - Consider cascading effects (changing one feature may impact others)
    - Identify all dependencies clearly
    - Assess risk level (Low/Medium/High)
    - Explain your reasoning

    Return a complete ChangeRequestPlan.
  "#
}
```

**Decompose Feature to Tasks (baml_src/prompts/decompose_tasks.baml):**
```python
function DecomposeFeatureToTasks(
  feature_name: string,
  feature_description: string,
  context: string  # Related features and constraints
) -> Task[] {
  client GPT4

  prompt #"
    You are breaking down a feature into atomic tasks.

    Feature: {{ feature_name }}
    Description: {{ feature_description }}

    Context:
    {{ context }}

    Generate 3-10 specific, actionable tasks that implement this feature.

    Guidelines:
    - Tasks should be atomic (single responsibility)
    - Include backend, frontend, and test tasks
    - Specify dependencies between tasks
    - Tasks should be implementable by a developer
    - Consider infrastructure needs (database, API, etc.)

    Return an array of Tasks.
  "#
}
```

### Planner Implementation (packages/ai/src/planner.ts)

```typescript
import { baml } from './baml_client';
import { Graph, ChangeRequest } from '@pottery/core';

export class Planner {
  /**
   * Generate initial project structure from user intent
   */
  async createProject(userIntent: string): Promise<ChangeRequest> {
    // Call BAML function
    const productIntent = await baml.CreateProjectStructure(userIntent);

    // Convert BAML output to internal graph structure
    const newNodes = this.convertToGraphNodes(productIntent);
    const dependencies = this.extractDependencies(productIntent);

    // Return as ChangeRequest format
    return {
      id: 'CR-000',
      project_id: '', // Set by caller
      initiator: 'ai',
      description: 'Initial project structure',
      status: 'pending',
      new_nodes: newNodes,
      modified_nodes: [],
      new_dependencies: dependencies,
      impact_map: [],
      created_at: new Date().toISOString()
    };
  }

  /**
   * Analyze a change request and generate CR plan
   */
  async analyzeChange(
    currentGraph: Graph,
    changeDescription: string
  ): Promise<Partial<ChangeRequest>> {
    // Serialize graph to JSON for BAML
    const graphJSON = this.serializeGraph(currentGraph);

    // Call BAML function
    const crPlan = await baml.AnalyzeChange(graphJSON, changeDescription);

    // Convert plan to ChangeRequest format
    return this.convertPlanToCR(crPlan, currentGraph);
  }

  /**
   * Perform impact analysis for a proposed change
   */
  async analyzeImpact(
    graph: Graph,
    proposedChanges: Partial<ChangeRequest>
  ): Promise<ImpactMapEntry[]> {
    // Use graph traversal + AI to identify impacts
    const directImpacts = this.findDirectImpacts(graph, proposedChanges);
    const cascadingImpacts = this.findCascadingImpacts(graph, directImpacts);

    return [...directImpacts, ...cascadingImpacts];
  }

  // Helper methods
  private convertToGraphNodes(productIntent: any): GraphNode[] { /* ... */ }
  private extractDependencies(productIntent: any): Dependency[] { /* ... */ }
  private serializeGraph(graph: Graph): string { /* ... */ }
  private convertPlanToCR(plan: any, graph: Graph): Partial<ChangeRequest> { /* ... */ }
  private findDirectImpacts(graph: Graph, changes: any): ImpactMapEntry[] { /* ... */ }
  private findCascadingImpacts(graph: Graph, impacts: any): ImpactMapEntry[] { /* ... */ }
}
```

### BAML Configuration (baml_src/main.baml)

```python
# Configure LLM clients
client<llm> GPT4 {
  provider openai
  options {
    model gpt-4-turbo-preview
    temperature 0.2
    max_tokens 4000
  }
}

client<llm> Claude {
  provider anthropic
  options {
    model claude-3-5-sonnet-20241022
    temperature 0.2
    max_tokens 4000
  }
}

# Set default client
generator lang_typescript {
  output_dir "./src/baml_client"
}
```

### Testing BAML Prompts

```python
# In baml_src/tests/create_project.test.baml
test CreateProjectStructure {
  functions [CreateProjectStructure]

  args {
    user_intent "Build a real-time collaborative task management app with user authentication"
  }

  assertions {
    # Validate structure
    output.sub_intents.length >= 2
    output.sub_intents.length <= 5

    # Validate features exist
    output.features.length >= 4

    # Validate tasks
    output.features[0].tasks.length >= 3
  }
}
```

**Run tests:**
```bash
npx baml test
```

---

## Storage Layer

### Implementation (packages/core/src/storage/)

**ProjectStore (ProjectStore.ts):**
```typescript
import fs from 'fs-extra';
import path from 'path';
import { Graph, ChangeRequest, GraphNode } from '../models';

export class ProjectStore {
  private basePath: string;
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.basePath = path.join(
      process.env.HOME || '~',
      '.pottery',
      'projects',
      projectId
    );
  }

  /**
   * Initialize project directory structure
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.basePath);
    await fs.ensureDir(path.join(this.basePath, 'change-requests'));
    await fs.ensureDir(path.join(this.basePath, 'versions'));

    // Create initial metadata
    const metadata = {
      project_id: this.projectId,
      name: '', // Set after CR-000 applied
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      current_version: 'v0'
    };

    await this.saveMetadata(metadata);

    // Create empty graph
    const emptyGraph: Graph = {
      version: 'v0',
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      }
    };

    await this.saveGraph(emptyGraph);
    await this.saveVersion('v0', emptyGraph);
  }

  /**
   * Load project metadata
   */
  async loadMetadata(): Promise<ProjectMetadata> {
    const metadataPath = path.join(this.basePath, 'metadata.json');
    return await fs.readJSON(metadataPath);
  }

  /**
   * Save project metadata
   */
  async saveMetadata(metadata: ProjectMetadata): Promise<void> {
    const metadataPath = path.join(this.basePath, 'metadata.json');
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Load current graph
   */
  async loadGraph(): Promise<Graph> {
    const graphPath = path.join(this.basePath, 'graph.json');
    const data = await fs.readJSON(graphPath);

    // Convert plain objects to Maps
    return {
      ...data,
      nodes: new Map(Object.entries(data.nodes)),
      edges: new Map(Object.entries(data.edges))
    };
  }

  /**
   * Save current graph
   */
  async saveGraph(graph: Graph): Promise<void> {
    const graphPath = path.join(this.basePath, 'graph.json');

    // Convert Maps to plain objects for JSON
    const data = {
      ...graph,
      nodes: Object.fromEntries(graph.nodes),
      edges: Object.fromEntries(graph.edges)
    };

    await fs.writeJSON(graphPath, data, { spaces: 2 });
  }

  /**
   * Save graph version snapshot
   */
  async saveVersion(version: string, graph: Graph): Promise<void> {
    const versionPath = path.join(
      this.basePath,
      'versions',
      `${version}.json`
    );

    const data = {
      ...graph,
      nodes: Object.fromEntries(graph.nodes),
      edges: Object.fromEntries(graph.edges)
    };

    await fs.writeJSON(versionPath, data, { spaces: 2 });
  }

  /**
   * Create a new ChangeRequest
   */
  async createChangeRequest(
    cr: Partial<ChangeRequest>
  ): Promise<ChangeRequest> {
    // Generate CR ID
    const crId = await this.getNextCRId();

    const fullCR: ChangeRequest = {
      ...cr,
      id: crId,
      project_id: this.projectId,
      status: 'pending',
      created_at: new Date().toISOString()
    } as ChangeRequest;

    // Save CR file
    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${crId}.json`
    );
    await fs.writeJSON(crPath, fullCR, { spaces: 2 });

    return fullCR;
  }

  /**
   * Apply a ChangeRequest to the graph
   */
  async applyChangeRequest(crId: string): Promise<void> {
    const cr = await this.loadChangeRequest(crId);

    if (cr.status === 'applied') {
      throw new Error(`CR ${crId} is already applied`);
    }

    const graph = await this.loadGraph();

    // Add new nodes
    for (const node of cr.new_nodes) {
      graph.nodes.set(node.id, node);
    }

    // Modify existing nodes
    for (const modification of cr.modified_nodes) {
      const node = graph.nodes.get(modification.node_id);
      if (!node) continue;

      // Create new version
      const newNode = {
        ...node,
        ...modification.changes,
        version: modification.new_version,
        updated_at: new Date().toISOString()
      };

      graph.nodes.set(node.id, newNode);
    }

    // Add new dependencies
    for (const dep of cr.new_dependencies) {
      graph.edges.set(dep.id, dep);
    }

    // Validate DAG
    const cycle = DAGValidator.detectCycle(graph);
    if (cycle) {
      throw new Error(`Cycle detected: ${cycle.join(' -> ')}`);
    }

    // Increment version
    const metadata = await this.loadMetadata();
    const nextVersion = this.incrementVersion(metadata.current_version);

    graph.version = nextVersion;
    graph.metadata.last_modified = new Date().toISOString();

    // Save updated graph
    await this.saveGraph(graph);
    await this.saveVersion(nextVersion, graph);

    // Update metadata
    metadata.current_version = nextVersion;
    metadata.last_modified = new Date().toISOString();
    if (crId === 'CR-000' && cr.new_nodes.length > 0) {
      // Extract project name from ProductIntent
      const intent = cr.new_nodes.find(n => n.id.startsWith('intent-'));
      if (intent) metadata.name = intent.name;
    }
    await this.saveMetadata(metadata);

    // Mark CR as applied
    cr.status = 'applied';
    cr.applied_at = new Date().toISOString();
    await this.saveChangeRequest(cr);
  }

  /**
   * Load a ChangeRequest
   */
  async loadChangeRequest(crId: string): Promise<ChangeRequest> {
    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${crId}.json`
    );
    return await fs.readJSON(crPath);
  }

  /**
   * List all ChangeRequests
   */
  async listChangeRequests(): Promise<ChangeRequest[]> {
    const crDir = path.join(this.basePath, 'change-requests');
    const files = await fs.readdir(crDir);

    const crs = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => this.loadChangeRequest(path.basename(f, '.json')))
    );

    return crs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Delete a pending ChangeRequest
   */
  async deleteChangeRequest(crId: string): Promise<void> {
    const cr = await this.loadChangeRequest(crId);

    if (cr.status === 'applied') {
      throw new Error(`Cannot delete applied CR ${crId}`);
    }

    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${crId}.json`
    );
    await fs.remove(crPath);
  }

  // Helper methods
  private async getNextCRId(): Promise<string> {
    const crs = await this.listChangeRequests();
    if (crs.length === 0) return 'CR-000';

    const lastId = Math.max(...crs.map(cr =>
      parseInt(cr.id.replace('CR-', ''))
    ));

    return `CR-${String(lastId + 1).padStart(3, '0')}`;
  }

  private incrementVersion(version: string): string {
    const num = parseInt(version.replace('v', ''));
    return `v${num + 1}`;
  }

  private async saveChangeRequest(cr: ChangeRequest): Promise<void> {
    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${cr.id}.json`
    );
    await fs.writeJSON(crPath, cr, { spaces: 2 });
  }
}
```

**Global Project Management:**
```typescript
export class GlobalProjectStore {
  private basePath: string;

  constructor() {
    this.basePath = path.join(process.env.HOME || '~', '.pottery', 'projects');
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    await fs.ensureDir(this.basePath);
    const dirs = await fs.readdir(this.basePath);

    const projects = await Promise.all(
      dirs.map(async (dir) => {
        const store = new ProjectStore(dir);
        return await store.loadMetadata();
      })
    );

    return projects.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async deleteProject(projectId: string): Promise<void> {
    const projectPath = path.join(this.basePath, projectId);
    await fs.remove(projectPath);
  }
}
```

---

## Web UI Implementation

### Technology Stack

**Frontend:**
- **Next.js 14+** (App Router)
- **React Flow** for graph visualization
- **Tailwind CSS** for styling
- **SWR** for data fetching
- **Zustand** for client state

**Backend:**
- **Next.js API Routes** for data access
- Reads directly from filesystem using `ProjectStore`

### Project Structure (packages/web/)

```
packages/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home (project list)
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx            # Project view
│   │   │       └── layout.tsx
│   │   └── api/
│   │       └── projects/
│   │           ├── route.ts            # List projects
│   │           └── [projectId]/
│   │               ├── route.ts        # Get project metadata
│   │               ├── graph/route.ts  # Get graph data
│   │               └── crs/
│   │                   ├── route.ts    # List CRs
│   │                   └── [crId]/route.ts  # Get CR detail
│   ├── components/
│   │   ├── graph/
│   │   │   ├── GraphView.tsx           # Main graph component
│   │   │   ├── GraphControls.tsx       # Zoom, filter controls
│   │   │   ├── NodeDetail.tsx          # Side panel
│   │   │   └── nodes/
│   │   │       ├── IntentNode.tsx
│   │   │       ├── SubIntentNode.tsx
│   │   │       ├── FeatureNode.tsx
│   │   │       ├── TaskNode.tsx
│   │   │       └── UXSpecNode.tsx
│   │   ├── cr/
│   │   │   ├── CRList.tsx
│   │   │   └── CRDetail.tsx
│   │   ├── history/
│   │   │   └── VersionHistory.tsx
│   │   └── ui/
│   │       ├── Tabs.tsx
│   │       └── Panel.tsx
│   ├── lib/
│   │   ├── api-client.ts               # API wrapper
│   │   ├── graph-utils.ts              # Graph layout algorithms
│   │   └── hooks/
│   │       ├── useGraph.ts
│   │       ├── useChangeRequests.ts
│   │       └── useVersionHistory.ts
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── tailwind.config.js
└── package.json
```

### API Routes

**List Projects (app/api/projects/route.ts):**
```typescript
import { NextResponse } from 'next/server';
import { GlobalProjectStore } from '@pottery/core';

export async function GET() {
  try {
    const store = new GlobalProjectStore();
    const projects = await store.listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Get Graph (app/api/projects/[projectId]/graph/route.ts):**
```typescript
import { NextResponse } from 'next/server';
import { ProjectStore } from '@pottery/core';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const store = new ProjectStore(params.projectId);
    const graph = await store.loadGraph();

    // Convert to JSON-friendly format
    const data = {
      version: graph.version,
      nodes: Array.from(graph.nodes.values()),
      edges: Array.from(graph.edges.values()),
      metadata: graph.metadata
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Graph Visualization (components/graph/GraphView.tsx)

```typescript
'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { IntentNode } from './nodes/IntentNode';
import { SubIntentNode } from './nodes/SubIntentNode';
import { FeatureNode } from './nodes/FeatureNode';
import { TaskNode } from './nodes/TaskNode';
import { UXSpecNode } from './nodes/UXSpecNode';
import { GraphControls } from './GraphControls';
import { NodeDetail } from './NodeDetail';
import { useGraph } from '@/lib/hooks/useGraph';
import { layoutGraph } from '@/lib/graph-utils';

interface GraphViewProps {
  projectId: string;
}

export function GraphView({ projectId }: GraphViewProps) {
  const { graph, isLoading, error } = useGraph(projectId);

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      intent: IntentNode,
      subintent: SubIntentNode,
      feature: FeatureNode,
      task: TaskNode,
      uxspec: UXSpecNode,
    }),
    []
  );

  // Convert graph to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    // Convert graph nodes to React Flow nodes
    const nodes: Node[] = graph.nodes.map(node => ({
      id: node.id,
      type: getNodeType(node),
      data: node,
      position: { x: 0, y: 0 }, // Will be calculated by layout
    }));

    // Convert graph edges to React Flow edges
    const edges: Edge[] = graph.edges.map(edge => ({
      id: edge.id,
      source: edge.from_id,
      target: edge.to_id,
      type: getEdgeType(edge.type),
      label: edge.type,
      animated: edge.type === 'impacts',
    }));

    // Calculate layout (hierarchical or force-directed)
    return layoutGraph(nodes, edges);
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Loading graph...</div>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full">
      <div className="text-red-500">Error: {error.message}</div>
    </div>;
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
        <MiniMap />
      </ReactFlow>

      <GraphControls
        nodes={nodes}
        onFilterChange={(filtered) => setNodes(filtered)}
      />

      {selectedNode && (
        <NodeDetail
          nodeId={selectedNode}
          graph={graph}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

function getNodeType(node: GraphNode): string {
  if (node.id.startsWith('intent-')) return 'intent';
  if (node.id.startsWith('subintent-')) return 'subintent';
  if (node.id.startsWith('feature-')) return 'feature';
  if (node.id.startsWith('task-')) return 'task';
  if (node.id.startsWith('uxspec-')) return 'uxspec';
  return 'default';
}

function getEdgeType(depType: DependencyType): string {
  switch (depType) {
    case 'requires': return 'default';
    case 'blocks': return 'step';
    case 'impacts': return 'smoothstep';
    case 'supersedes': return 'straight';
    default: return 'default';
  }
}
```

### Graph Layout Algorithm (lib/graph-utils.ts)

```typescript
import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

/**
 * Calculate hierarchical layout using Dagre
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

  // Add nodes
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: getNodeWidth(node),
      height: getNodeHeight(node)
    });
  });

  // Add edges
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - getNodeWidth(node) / 2,
        y: nodeWithPosition.y - getNodeHeight(node) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getNodeWidth(node: Node): number {
  switch (node.type) {
    case 'intent': return 250;
    case 'subintent': return 220;
    case 'feature': return 200;
    case 'task': return 180;
    case 'uxspec': return 180;
    default: return 200;
  }
}

function getNodeHeight(node: Node): number {
  return 80;
}
```

### Custom Node Component (components/graph/nodes/FeatureNode.tsx)

```typescript
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface FeatureNodeProps {
  data: Feature;
}

export const FeatureNode = memo(({ data }: FeatureNodeProps) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-green-500 bg-white min-w-[200px]">
      <Handle type="target" position={Position.Top} />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id} • v{data.version}
        </div>
        <div className="font-semibold text-sm text-gray-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600">
          {data.linked_tasks.length} tasks
        </div>
        {data.ux_spec && (
          <div className="text-xs text-pink-600">
            • UX Spec
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

FeatureNode.displayName = 'FeatureNode';
```

### Server Start Script

Create a standalone server script for `pottery serve`:

**packages/web/server.js:**
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const projectId = process.env.PROJECT_ID;

if (!projectId) {
  console.error('Error: PROJECT_ID environment variable is required');
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    // Inject projectId into request
    req.projectId = projectId;

    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Project: ${projectId}`);
  });
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Core data structures and storage

**Tasks:**
1. Set up monorepo structure (PNPM workspace)
2. Create TypeScript types for all entities (packages/core/src/models/)
3. Implement storage layer (ProjectStore, GraphStore)
4. Implement DAG validation (cycle detection)
5. Write unit tests for core models and validation

**Deliverables:**
- `@pottery/core` package with full type definitions
- Working filesystem storage with JSON persistence
- DAG validation preventing circular dependencies

**Testing:**
- Unit tests for all model constructors
- Storage CRUD operations
- DAG cycle detection with various graph scenarios

---

### Phase 2: CLI Scaffolding (Week 2)
**Goal:** Basic CLI commands without AI

**Tasks:**
1. Set up CLI package with Commander.js
2. Implement `pottery create` (manual project creation)
3. Implement `pottery list`
4. Implement `pottery delete`
5. Implement `pottery cr list`, `pottery cr show`, `pottery cr delete`
6. Create output formatting utilities (boxen, chalk, tables)

**Deliverables:**
- `@pottery/cli` package with all commands
- Beautiful terminal output matching UI spec
- Working project lifecycle (create → list → delete)

**Testing:**
- Manual testing of each command
- Test with mock data
- Validate output formatting

---

### Phase 3: AI Integration with BAML (Week 3-4)
**Goal:** AI-powered project generation and change analysis

**Tasks:**
1. Set up BAML project structure
2. Define BAML types for all entities
3. Create prompt for `CreateProjectStructure`
4. Create prompt for `AnalyzeChange`
5. Create prompt for `DecomposeFeatureToTasks`
6. Implement Planner class
7. Implement impact analysis logic
8. Integrate AI with CLI commands
9. Test with various inputs

**Deliverables:**
- `@pottery/ai` package with BAML integration
- Working AI-powered `pottery create --intent "..."`
- Working AI-powered `pottery change --project-id X "..."`
- Comprehensive prompt testing

**Testing:**
- BAML unit tests for each prompt
- Test with various user intents
- Validate graph structure consistency
- Test edge cases (ambiguous requests, missing context)

---

### Phase 4: Change Request Application (Week 5)
**Goal:** Apply CRs to update graph

**Tasks:**
1. Implement `pottery cr apply`
2. Implement graph merging logic
3. Implement versioning (node version bumps)
4. Implement version snapshot storage
5. Add validation (DAG check on merge)
6. Handle edge cases (conflicts, invalid modifications)

**Deliverables:**
- Working CR application flow
- Graph versioning with history
- Safe merging with validation

**Testing:**
- Apply various CRs to test graphs
- Verify DAG constraints are maintained
- Test version history accuracy
- Test rollback scenarios (manual for MVP)

---

### Phase 5: Web UI - Setup (Week 6)
**Goal:** Basic Next.js app with API routes

**Tasks:**
1. Set up Next.js project with App Router
2. Create API routes for projects, graph, CRs
3. Implement data fetching hooks (SWR)
4. Create basic page layouts
5. Set up Tailwind CSS

**Deliverables:**
- `@pottery/web` package
- Working API layer reading from filesystem
- Basic routing structure

**Testing:**
- Test API endpoints with Postman/curl
- Verify data serialization
- Test with multiple projects

---

### Phase 6: Web UI - Graph Visualization (Week 7-8)
**Goal:** Interactive graph view

**Tasks:**
1. Integrate React Flow
2. Implement graph layout algorithm (Dagre)
3. Create custom node components (Intent, Feature, Task, UXSpec)
4. Style nodes with Tailwind
5. Implement zoom/pan/search controls
6. Add node filtering by type
7. Implement node detail panel

**Deliverables:**
- Working interactive graph visualization
- Beautiful node rendering
- Smooth interactions (zoom, pan, click)
- Detail panel with full node info

**Testing:**
- Test with small graphs (10-20 nodes)
- Test with large graphs (100+ nodes)
- Verify performance
- Test on different screen sizes

---

### Phase 7: Web UI - CR and History Views (Week 9)
**Goal:** Complete read-only UI

**Tasks:**
1. Implement Change Requests view
2. Create CR detail panel
3. Implement History/Version view
4. Add version comparison (diff view)
5. Polish styling and interactions

**Deliverables:**
- Complete CR visualization
- Version history timeline
- Graph diff viewer

**Testing:**
- View CRs with various structures
- Compare versions
- Verify all data is displayed correctly

---

### Phase 8: Server Management (Week 10)
**Goal:** `pottery serve` commands

**Tasks:**
1. Create standalone server script
2. Implement `pottery serve` (start server)
3. Implement `pottery serve stop`
4. Implement `pottery serve list`
5. Add PID tracking for background processes
6. Auto-open browser on start

**Deliverables:**
- Background server management
- Easy start/stop commands
- Multi-project server support

**Testing:**
- Start/stop servers
- Run multiple servers on different ports
- Verify process management
- Test automatic browser opening

---

### Phase 9: Integration Testing (Week 11)
**Goal:** End-to-end validation

**Tasks:**
1. Create integration tests for full workflows
2. Test complete lifecycle: create → change → apply → visualize
3. Test with realistic project examples
4. Performance testing (large graphs)
5. Error handling and edge cases

**Deliverables:**
- Comprehensive integration test suite
- Performance benchmarks
- Bug fixes from testing

**Testing Scenarios:**
- Create project → apply CR-000 → view in web UI
- Create project → add 3 changes → apply all → verify graph
- Create project with 50+ features
- Test cycle detection with complex dependencies
- Test concurrent server instances

---

### Phase 10: Polish & Documentation (Week 12)
**Goal:** Production-ready MVP

**Tasks:**
1. Write user documentation (README, guides)
2. Add inline code documentation
3. Create example projects
4. Polish CLI output
5. Polish web UI styling
6. Add error messages and help text
7. Create demo video/screenshots

**Deliverables:**
- Complete user documentation
- Developer documentation
- Example projects
- Demo materials

---

## Testing Strategy

### Unit Tests
**Framework:** Jest + ts-jest

**Coverage Areas:**
- Core models (construction, validation)
- DAG validation (cycle detection, topological sort)
- Dependency validation (type-specific rules)
- Storage layer (CRUD operations)
- BAML prompt outputs (structure validation)

**Example:**
```typescript
// packages/core/src/validation/__tests__/dag.test.ts
import { DAGValidator } from '../dag';
import { Graph } from '../../models/Graph';

describe('DAGValidator', () => {
  describe('detectCycle', () => {
    it('should detect simple cycle', () => {
      const graph = createGraphWithCycle();
      const cycle = DAGValidator.detectCycle(graph);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain('node-a');
      expect(cycle).toContain('node-b');
    });

    it('should return null for acyclic graph', () => {
      const graph = createAcyclicGraph();
      const cycle = DAGValidator.detectCycle(graph);
      expect(cycle).toBeNull();
    });
  });
});
```

### Integration Tests
**Framework:** Jest with file system mocking

**Coverage Areas:**
- Full CLI command workflows
- CR creation → application → graph update
- Multi-version graph evolution
- API routes with real storage

**Example:**
```typescript
// packages/cli/__tests__/integration/create-apply.test.ts
describe('Create and Apply Workflow', () => {
  it('should create project and apply initial CR', async () => {
    // Create project
    const projectId = await cli.create({
      intent: 'Build a todo app'
    });

    // Verify CR-000 exists
    const crs = await cli.listCRs(projectId);
    expect(crs).toHaveLength(1);
    expect(crs[0].id).toBe('CR-000');

    // Apply CR-000
    await cli.applyCR(projectId, 'CR-000');

    // Verify graph was created
    const graph = await loadGraph(projectId);
    expect(graph.version).toBe('v1');
    expect(graph.nodes.size).toBeGreaterThan(0);
  });
});
```

### E2E Tests
**Framework:** Playwright

**Coverage Areas:**
- Web UI interactions
- Graph visualization
- Node detail panels
- Version history navigation

**Example:**
```typescript
// packages/web/__tests__/e2e/graph-view.spec.ts
import { test, expect } from '@playwright/test';

test('should display graph and open node detail', async ({ page }) => {
  await page.goto('/projects/proj_test123');

  // Wait for graph to load
  await page.waitForSelector('.react-flow');

  // Click on a feature node
  await page.click('[data-id="feature-001"]');

  // Verify detail panel opens
  await expect(page.locator('.node-detail-panel')).toBeVisible();
  await expect(page.locator('.node-detail-panel')).toContainText('Feature-001');
});
```

### BAML Prompt Tests
**Framework:** BAML built-in testing

**Coverage Areas:**
- Prompt output structure validation
- Edge case handling
- Various input scenarios

**Example:**
```python
# packages/ai/baml_src/tests/create_project.test.baml
test "simple todo app" {
  functions [CreateProjectStructure]
  args {
    user_intent "Build a simple todo app"
  }
  assertions {
    output.sub_intents.length >= 2
    output.features.length >= 3
    output.sub_intents[0].features.length >= 1
  }
}

test "complex e-commerce platform" {
  functions [CreateProjectStructure]
  args {
    user_intent "Build a full-featured e-commerce platform with payments, inventory, and shipping"
  }
  assertions {
    output.sub_intents.length >= 4
    output.features.length >= 10
    # Should have backend, frontend, and test tasks
    output.features[0].tasks.any(t => t.type == "Backend")
    output.features[0].tasks.any(t => t.type == "Frontend")
  }
}
```

---

## Deployment Considerations

### Distribution
**Method:** npm package

**Installation:**
```bash
npm install -g pottery
```

**Package Structure:**
- Single executable CLI tool
- Bundles all dependencies (CLI, Core, AI, Web)
- Includes Next.js web UI assets

**Build Process:**
1. Build all packages in monorepo
2. Bundle CLI with dependencies
3. Bundle web UI for production
4. Create single distributable package

### Environment Variables
```bash
# Required for AI features
OPENAI_API_KEY=...
# or
ANTHROPIC_API_KEY=...

# Optional
POTTERY_HOME=~/.pottery  # Default storage location
```

### System Requirements
- Node.js >= 18
- 100MB disk space (per project)
- Internet connection (for AI features)

### Configuration File
**~/.pottery/config.json:**
```json
{
  "llm_provider": "openai",  // or "anthropic"
  "model": "gpt-4-turbo-preview",
  "storage_path": "~/.pottery",
  "default_port": 3000
}
```

---

## Security Considerations

### API Keys
- Store in environment variables only
- Never commit to version control
- Provide clear setup instructions

### Filesystem Access
- Restrict all operations to ~/.pottery directory
- Validate all file paths
- Prevent directory traversal attacks

### Web UI
- Read-only for MVP (no write operations)
- Local-only server (no external access)
- No authentication needed for MVP
- CORS disabled (local only)

### Dependency Security
- Regular dependency audits with `npm audit`
- Pin dependency versions
- Use only well-maintained packages

---

## Performance Considerations

### Graph Size
- Target: Smooth performance up to 500 nodes
- React Flow handles 1000+ nodes well
- Use virtualization if needed

### Storage
- JSON files are sufficient for MVP
- Single project rarely exceeds 10MB
- Fast read/write on modern SSDs

### AI API Calls
- Cache results when appropriate
- Show loading indicators
- Handle rate limits gracefully
- Implement retry logic

### Web UI
- Lazy load graph data
- Debounce search/filter operations
- Use React.memo for node components
- Implement code splitting

---

## Future Enhancements (Post-MVP)

### Agent Execution
- Execute tasks automatically
- Track execution status
- Link artifacts (code files) to tasks

### Advanced Planning
- Concurrent CR conflict resolution
- AI-powered dependency inference
- Automated task sizing estimation

### Collaboration
- Multi-user support
- Real-time graph updates
- Comment threads on nodes

### Integrations
- GitHub/GitLab sync
- Jira/Linear integration
- CI/CD hooks

---

## Success Metrics

### MVP Goals
1. **Functional Completeness**: All CLI commands work as specified
2. **AI Quality**: 80%+ of generated structures are usable without modification
3. **Visualization**: Graph renders smoothly with 100+ nodes
4. **Usability**: Users can create and evolve a project in < 10 minutes
5. **Reliability**: No data corruption, all operations reversible

### Performance Targets
- Project creation: < 30 seconds
- CR analysis: < 20 seconds
- CR application: < 5 seconds
- Graph load in UI: < 2 seconds
- CLI command responsiveness: < 500ms

---

## Risk Mitigation

### Technical Risks

**Risk:** AI generates invalid graph structures
**Mitigation:**
- Strict BAML type validation
- Post-generation validation
- Fallback to manual editing

**Risk:** DAG cycles introduced during CR merge
**Mitigation:**
- Pre-merge cycle detection
- Rollback on validation failure
- Clear error messages

**Risk:** Performance issues with large graphs
**Mitigation:**
- Performance testing with realistic data
- Graph virtualization if needed
- Pagination/lazy loading

**Risk:** Complex dependency resolution
**Mitigation:**
- Start with simple dependency types
- Extensive testing of edge cases
- Clear documentation of limitations

### Process Risks

**Risk:** Scope creep beyond MVP
**Mitigation:**
- Strict adherence to PRD
- Defer all "nice-to-have" features
- Focus on core workflows first

**Risk:** BAML learning curve
**Mitigation:**
- Start with simple prompts
- Iterate based on testing
- Comprehensive prompt documentation

---

## Conclusion

This implementation plan provides a clear roadmap for building Pottery MVP over 12 weeks. The phased approach ensures each component is thoroughly tested before moving forward. By using BAML for AI integration, we get type-safe LLM interactions with versioned prompts. The monorepo structure keeps code organized and enables easy sharing of types between CLI, AI, and Web packages.

**Key Success Factors:**
1. Strong TypeScript typing throughout
2. BAML for structured AI output
3. Comprehensive testing at each phase
4. Clear separation of concerns (CLI, Core, AI, Web)
5. User-focused CLI output and web UI

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation
