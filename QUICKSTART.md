# Pottery Quick Start Guide

Get started with Pottery in 5 minutes!

## Prerequisites

Ensure you have:
- Node.js >= 18
- pnpm >= 8
- OpenAI API key OR Anthropic API key

## Setup (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
pnpm build
```

### 2. Set API Key

```bash
# For OpenAI (recommended)
export OPENAI_API_KEY="sk-..."

# Or for Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Link CLI (Optional - for easier access)

```bash
cd packages/cli
npm link
cd ../..
```

Now you can use `pottery` from anywhere!

## Your First Project (2 minutes)

### Create a Project

```bash
# Using linked CLI
pottery create --intent "Build a blog platform with markdown support"

# Or using node directly
node packages/cli/dist/index.js create --intent "Build a blog platform with markdown support"
```

You'll get output like:
```
🎨 Creating new project...
✓ Created project: proj_abc12345

📋 Project ID: proj_abc12345
```

**Save this project ID!** You'll need it for all future commands.

### Review the Generated Plan

```bash
pottery cr show --project-id proj_abc12345 --cr-id CR-000
```

This shows you the AI-generated product structure with SubIntents, Features, and Tasks.

### Apply the Plan

```bash
pottery cr apply --project-id proj_abc12345 --cr-id CR-000
```

This creates version `v1` of your product graph!

### Visualize Your Project

```bash
pottery serve --project-id proj_abc12345
```

This starts a local web server and automatically opens your browser to view the interactive graph visualization!

**What you can do in the web UI:**
- 🔍 **Search** nodes by name, ID, or description
- 🎯 **Filter** by node type (Intent, SubIntent, Feature, Task, UXSpec)
- 🔎 **Zoom and pan** to explore the graph
- 📍 **Click nodes** to view detailed information and dependencies
- 🗺️ **Use the minimap** for easy navigation

**Server management:**
```bash
pottery serve list              # List running servers
pottery serve stop --port 3000  # Stop specific server
pottery serve stop              # Stop all servers
```

The web UI refreshes automatically every 5 seconds, so you'll see changes as you apply ChangeRequests!

### Make a Change

```bash
pottery change --project-id proj_abc12345 "Add user authentication with email/password"
```

The AI analyzes your graph and creates CR-001 with:
- New features to add
- New tasks to implement
- Impact on existing components

### Apply the Change

```bash
pottery cr apply --project-id proj_abc12345 --cr-id CR-001
```

Now you're at version `v2`!

### View All Projects

```bash
pottery list
```

### View All ChangeRequests

```bash
pottery cr list --project-id proj_abc12345
```

## Common Workflows

### Iterating on a New Project

```bash
# Create project
PROJECT_ID=$(pottery create --intent "..." | grep "Project ID:" | awk '{print $3}')

# Review
pottery cr show --project-id $PROJECT_ID --cr-id CR-000

# Not satisfied? Delete and recreate
pottery delete --project-id $PROJECT_ID

# Or apply if you like it
pottery cr apply --project-id $PROJECT_ID --cr-id CR-000

# Visualize it!
pottery serve --project-id $PROJECT_ID
```

### Evolving an Existing Project

```bash
# Propose changes
pottery change --project-id <id> "Add real-time notifications"
pottery change --project-id <id> "Add admin dashboard"

# Review all pending changes
pottery cr list --project-id <id>

# Apply them one by one
pottery cr apply --project-id <id> --cr-id CR-002
pottery cr apply --project-id <id> --cr-id CR-003
```

### Visual Exploration

```bash
# Start server for a project
pottery serve --project-id <id>

# Open multiple projects on different ports
pottery serve --project-id proj_123 --port 3000
pottery serve --project-id proj_456 --port 3001

# Check what's running
pottery serve list

# Stop when done
pottery serve stop
```

## File Storage

All data is stored locally in:
```
~/.pottery/
  projects/
    proj_abc12345/
      metadata.json          # Project info
      graph.json             # Current state
      change-requests/       # All CRs
      versions/              # Version history
```

You can inspect these JSON files directly to understand your project structure.

## Tips

1. **Be Specific**: More detailed intents produce better plans
   - Good: "Build a task manager with drag-and-drop, tags, and team collaboration"
   - Better: "Build a task manager like Trello with Kanban boards, drag-and-drop cards, color-coded tags, team workspaces, and real-time sync"

2. **Iterate on Changes**: Don't like a ChangeRequest? Delete it and try again with different wording
   ```bash
   pottery cr delete --project-id <id> --cr-id CR-001
   pottery change --project-id <id> "more detailed description..."
   ```

3. **Version History**: Each CR application creates a new version. You can see the evolution:
   ```bash
   ls ~/.pottery/projects/<project-id>/versions/
   ```

4. **DAG Validation**: Pottery prevents circular dependencies automatically. If a CR would create a cycle, it will be rejected.

## Troubleshooting

### "Command not found: pottery"

You need to either:
- Run `npm link` from `packages/cli`
- Use the full path: `node packages/cli/dist/index.js`
- Add an alias: `alias pottery="node /path/to/pottery/packages/cli/dist/index.js"`

### "API key not found"

Make sure you've exported your API key:
```bash
echo $OPENAI_API_KEY  # Should show your key
```

### "Project not found"

Double-check your project ID. List all projects:
```bash
pottery list
```

### Build Errors

If you see TypeScript errors:
```bash
pnpm clean
pnpm install
pnpm build
```

## Next Steps

- Explore the [full README](./README.md)
- Read the [Product Requirements](./PROJECT.md)
- Check out the [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- Try building a complex project with multiple features
- Experiment with different change descriptions to see how the AI responds

Happy planning! 🎨
