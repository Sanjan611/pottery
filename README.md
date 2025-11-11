# Pottery

> A planning framework that enables autonomous software agents to build products by representing project structure as a living directed acyclic graph (DAG).

Pottery turns high-level product goals into structured plans and evolves them safely over time. It represents every component of a product—vision, UX, features, and tasks—as nodes in a DAG, providing rich context for AI agents to understand and build software.

## Features

- **AI-Powered Project Generation**: Describe your product idea and get a complete structured plan
- **Graph-Based Planning**: Product structure represented as a DAG with intents, features, and tasks
- **Safe Evolution**: All changes go through versioned ChangeRequests with impact analysis
- **DAG Validation**: Prevents circular dependencies automatically
- **Local Storage**: Simple JSON-based file storage in `~/.pottery`
- **Future-Ready**: Foundation for autonomous agent execution (coming soon)

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **OpenAI API Key** or **Anthropic API Key** (for AI features)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd pottery

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally (optional)
cd packages/cli
npm link
```

## Setup

### API Keys

Pottery uses AI models for planning. You need to set up an API key:

**For OpenAI (GPT-4):**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**For Anthropic (Claude):**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make them permanent.

## Quick Start

### 1. Create a New Project

```bash
pottery create --intent "Build a task management app with real-time collaboration"
```

This will:
- Generate a unique project ID
- Create an AI-powered product structure (ProductIntent, SubIntents, Features, Tasks)
- Save as ChangeRequest CR-000 for review

Output:
```
🎨 Creating new project...
✓ Created project: proj_7x9k2m4n

╭─── CR-000: Initial project structure ───╮
│ Project: proj_7x9k2m4n                   │
│ Status: Pending                          │
│                                          │
│ 🆕 New Nodes: 45                        │
│   └─ ProductIntent: Task Management App │
│      ├─ SubIntent: Real-time sync       │
│      ├─ SubIntent: User Experience      │
│      ├─ 8 Features                      │
│      └─ 32 Tasks                        │
╰──────────────────────────────────────────╯

📋 Project ID: proj_7x9k2m4n

Review and apply:
  pottery cr show --project-id proj_7x9k2m4n --cr-id CR-000
  pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-000
```

### 2. Review the Initial Structure

```bash
pottery cr show --project-id proj_7x9k2m4n --cr-id CR-000
```

### 3. Apply the ChangeRequest

```bash
pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-000
```

This creates version `v1` of your product graph.

### 4. List All Projects

```bash
pottery list
```

### 5. Propose a Change

```bash
pottery change --project-id proj_7x9k2m4n "Add user authentication with JWT"
```

The AI will:
- Analyze the current product graph
- Determine what features and tasks need to be created
- Identify impacts on existing components
- Create a new ChangeRequest

### 6. Apply the Change

```bash
pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-001
```

## CLI Commands

### Project Management

| Command | Description |
|---------|-------------|
| `pottery create --intent "..."` | Create new project |
| `pottery list` | List all projects |
| `pottery delete --project-id <id>` | Delete a project |

### Change Requests

| Command | Description |
|---------|-------------|
| `pottery change --project-id <id> "description"` | Create change request |
| `pottery cr list --project-id <id>` | List all CRs |
| `pottery cr show --project-id <id> --cr-id <cr-id>` | View CR details |
| `pottery cr apply --project-id <id> --cr-id <cr-id>` | Apply CR to graph |
| `pottery cr delete --project-id <id> --cr-id <cr-id>` | Delete pending CR |

### Web UI (Coming Soon)

| Command | Description |
|---------|-------------|
| `pottery serve --project-id <id> [--port 3000]` | Start visualization server |

## Project Structure

```
pottery/
├── packages/
│   ├── core/           # Core domain models, storage, validation
│   ├── cli/            # CLI application
│   ├── ai/             # BAML AI integration
│   └── web/            # Next.js web UI (future)
├── PROJECT.md          # Product requirements
├── USER_INTERFACE.md   # Interface specification
└── IMPLEMENTATION_PLAN.md  # Technical implementation details
```

## Storage Structure

All data is stored in `~/.pottery/`:

```
~/.pottery/
  projects/
    proj_7x9k2m4n/
      metadata.json              # Project info
      graph.json                 # Current graph state
      change-requests/
        CR-000.json
        CR-001.json
      versions/
        v0.json                  # Empty graph
        v1.json                  # After CR-000
        v2.json                  # After CR-001
```

## Core Concepts

### Graph Nodes

- **ProductIntent**: Root vision and goals
- **SubIntent**: Strategic pillars (e.g., "Scalability", "Security")
- **Feature**: User-facing capabilities
- **Task**: Atomic units of work (Backend, Frontend, Test, Infrastructure)
- **UXSpec**: User experience goals for features
- **Dependency**: Relationships between nodes (requires, blocks, impacts, supersedes)

### ChangeRequests

All modifications go through ChangeRequests:
1. **Proposed** - AI generates the CR
2. **Analyzed** - Impact analysis completed
3. **Reviewed** - User approves/modifies
4. **Applied** - Graph updated with new version

### Versioning

- Every CR application creates a new graph version
- All nodes are versioned
- Previous versions are preserved
- No circular dependencies allowed (DAG constraint)

## Development

### Build All Packages

```bash
pnpm build
```

### Build Specific Package

```bash
pnpm --filter @pottery/core build
pnpm --filter @pottery/ai build
pnpm --filter @pottery/cli build
```

### Run Tests

```bash
pnpm test
```

### Development Mode

```bash
pnpm dev
```

## Technology Stack

- **TypeScript**: Type-safe development
- **BAML**: Typed LLM interactions
- **Commander.js**: CLI framework
- **fs-extra**: File system operations
- **chalk/boxen/ora**: Beautiful CLI output

## Roadmap

### ✅ MVP (Current)
- Core graph data model
- CLI for project management
- AI-powered planning with BAML
- ChangeRequest workflow
- DAG validation
- Version control

### 🚧 Future Features
- **Web UI**: Interactive graph visualization with React Flow
- **Agent Execution**: Autonomous task execution by AI agents
- **Real-time Collaboration**: Multi-user support
- **Integrations**: GitHub, Jira, Linear
- **Advanced Planning**: Concurrent CR conflict resolution

## Contributing

This is a greenfield project focused on enabling autonomous software agents. Contributions are welcome!

## License

MIT

## Documentation

- [Product Requirements](./PROJECT.md)
- [UI Specification](./USER_INTERFACE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)

---

**Built for the future of AI-powered software development** 🚀
