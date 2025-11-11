# User Interface Specification

**Product:** Pottery
**Version:** MVP
**Last Updated:** 2025-11-10

---

## Overview

Pottery's MVP interface consists of two components:
1. **CLI** - Primary interaction method for all operations (create, change, apply, delete)
2. **Web UI** - Read-only visualization for understanding the product graph

All commands are explicitly scoped to a project using `--project-id` for clarity and scriptability.

---

## CLI Interface

### Project Management

#### Create Project
```bash
pottery create --intent "the idea"
```

**Behavior:**
- AI analyzes the intent and generates initial ProductIntent
- Automatically creates SubIntents, Features, and Tasks
- Creates a pending **CR-000** (initial structure) for review
- Returns a unique project ID
- User must apply CR-000 to finalize the project

**Example Output:**
```
🎨 Creating new project...
🤖 AI analyzing intent and generating product structure...

✓ Created project: proj_7x9k2m4n
  Name: Collaborative task management app

╭─── CR-000: Initial project structure ───────╮
│                                              │
│ Project: proj_7x9k2m4n                       │
│ Status: Pending                              │
│                                              │
│ 🆕 New Nodes: 61                            │
│   └─ ProductIntent: Collaborative task mgmt │
│      ├─ SubIntent: Real-time collaboration  │
│      ├─ SubIntent: User experience          │
│      ├─ SubIntent: Data persistence         │
│      ├─ 12 Features                         │
│      └─ 45 Tasks                            │
│                                              │
╰──────────────────────────────────────────────╯

📋 Project ID: proj_7x9k2m4n

Review and apply:
  pottery cr show --project-id proj_7x9k2m4n --cr-id CR-000
  pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-000

Or delete if not satisfied:
  pottery delete --project-id proj_7x9k2m4n
```

#### List Projects
```bash
pottery list
```

**Behavior:**
- Shows all projects with their IDs, names, and creation dates
- Sorted by most recently created

**Example Output:**
```
Projects (3):

  proj_7x9k2m4n  Collaborative task management app    3 days ago
  proj_3a8f1x2p  E-commerce platform                  1 week ago
  proj_9m2k5n7q  Mobile fitness tracker               2 weeks ago

Use 'pottery view --project-id <id>' to visualize
```

#### Delete Project
```bash
pottery delete --project-id <id>
```

**Behavior:**
- Shows warning with summary of what will be deleted
- Requires user to type project ID to confirm
- Permanently deletes all project data

**Example Output:**
```
⚠️  Warning: This will permanently delete project proj_7x9k2m4n:
   • Name: Collaborative task management app
   • 1 ProductIntent
   • 3 SubIntents
   • 12 Features
   • 45 Tasks
   • 6 ChangeRequests (2 pending, 4 applied)

Type project ID to confirm: proj_7x9k2m4n

✓ Project deleted
```

#### Delete All Projects
```bash
pottery delete --all
```

**Behavior:**
- Lists all projects that will be deleted
- Shows warning with total project count
- Requires user to type "DELETE ALL" to confirm
- Permanently deletes all project data
- Cannot be used together with `--project-id`

**Example Output:**
```
⚠️  Warning: This will permanently delete ALL 3 projects:

   • proj_7x9k2m4n - Collaborative task management app
   • proj_3a8f1x2p - E-commerce platform
   • proj_9m2k5n7q - Mobile fitness tracker

Type DELETE ALL to confirm: DELETE ALL

✓ Deleted all 3 projects
```

**Error Cases:**
```
# No option provided
✗ Error: Must specify either --project-id or --all

Examples:
  pottery delete --project-id proj_123
  pottery delete --all
```

```
# Both options provided
✗ Error: Cannot use --project-id and --all together
```

```
# No projects to delete
No projects to delete
```

### Server Management

#### Start Server
```bash
pottery serve --project-id <id> [--port 3000]
```

**Behavior:**
- Starts local web server in background
- Opens browser automatically to project visualization
- Returns control to terminal immediately

**Example Output:**
```
🌐 Starting Pottery server...
✓ Server running at http://localhost:3000
  Project: proj_7x9k2m4n (Collaborative task management app)
  PID: 12345

Opening browser...

💡 View server status: pottery serve list
   Stop server: pottery serve stop
```

#### List Running Servers
```bash
pottery serve list
```

**Behavior:**
- Shows all running Pottery servers
- Displays project ID, port, and PID

**Example Output:**
```
Running servers (2):

  Port 3000  proj_7x9k2m4n  Collaborative task management app  PID: 12345
  Port 3001  proj_3a8f1x2p  E-commerce platform               PID: 12346

Stop a server: pottery serve stop --port <port>
Stop all: pottery serve stop
```

#### Stop Server
```bash
pottery serve stop [--port <port>]
```

**Behavior:**
- Stops server on specified port
- If no port specified, stops all running Pottery servers

**Example Output:**
```
✓ Stopped server on port 3000
```

### Change Request Operations

#### Create Change Request
```bash
pottery change --project-id <id> "description"
```

**Behavior:**
- AI analyzes the requested change
- Determines impact across the product graph
- Creates a new pending ChangeRequest
- Displays summary of changes

**Example Output:**
```
🔍 Analyzing impact...
✓ Created ChangeRequest: CR-001

╭─── CR-001: Add user authentication ──────╮
│                                           │
│ Project: proj_7x9k2m4n                    │
│ Status: Pending                           │
│                                           │
│ 🆕 New Nodes: 6                          │
│ 🔄 Modified Nodes: 2                     │
│ 🔗 New Dependencies: 3                   │
│                                           │
╰───────────────────────────────────────────╯

Actions:
  pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-001
  pottery cr show --project-id proj_7x9k2m4n --cr-id CR-001
  pottery cr delete --project-id proj_7x9k2m4n --cr-id CR-001
```

**Note on Iteration:**
If the generated CR doesn't match expectations, delete it and create a new one with a refined description:
```bash
pottery cr delete --project-id proj_7x9k2m4n --cr-id CR-001
pottery change --project-id proj_7x9k2m4n "add JWT-based authentication with session management and password hashing"
```
The more detailed your change description, the better the AI can generate the desired structure.

#### List Change Requests
```bash
pottery cr list --project-id <id>
```

**Behavior:**
- Shows all CRs for the project
- Separated into Pending and Applied sections
- Sorted by most recent

**Example Output:**
```
Project: proj_7x9k2m4n (Collaborative task management app)

Pending (2):
  CR-003  Add payment integration       2 hours ago
  CR-001  Add user authentication       1 day ago

Applied (5):
  CR-002  Update API error handling     2 days ago
  CR-000  Initial project structure     3 days ago
  ...

Use 'pottery cr show --project-id proj_7x9k2m4n --cr-id <cr-id>' for details
```

#### Show Change Request Details
```bash
pottery cr show --project-id <id> --cr-id <cr-id>
```

**Behavior:**
- Displays comprehensive details of the CR
- Shows all new nodes, modified nodes, and dependencies
- Displays impact map
- Provides command to apply if pending

**Example Output:**
```
╭─── ChangeRequest CR-001 ─────────────────────────────╮
│                                                       │
│ Project: proj_7x9k2m4n                                │
│ Description: Add user authentication                  │
│ Status: Pending                                       │
│ Created: 1 day ago                                    │
│                                                       │
│ 🆕 New Nodes (6):                                    │
│   └─ Feature-024: User Authentication                │
│      ├─ Task-089: Implement JWT auth service         │
│      ├─ Task-090: Create login/signup UI             │
│      ├─ Task-091: Add password hashing utilities     │
│      ├─ Task-092: Implement session management       │
│      └─ Task-093: Write auth integration tests       │
│                                                       │
│ 🔄 Modified Nodes (2):                               │
│   └─ Feature-003: API Gateway                        │
│      └─ Task-015 → Task-015@v2 (add auth middleware) │
│   └─ Feature-007: User Dashboard                     │
│      └─ Task-034 → Task-034@v2 (add auth checks)     │
│                                                       │
│ 🔗 New Dependencies (3):                             │
│   ├─ Feature-024 → Feature-003 (requires)            │
│   ├─ Task-090 → Task-089 (requires)                  │
│   └─ Feature-024 → Feature-007 (impacts)             │
│                                                       │
│ 📍 Impact Map:                                       │
│   ├─ SubIntent-02: Security (aligned ✓)              │
│   └─ Feature-007: User Dashboard (impacts)           │
│                                                       │
╰───────────────────────────────────────────────────────╯

Apply: pottery cr apply --project-id proj_7x9k2m4n --cr-id CR-001
```

#### Apply Change Request
```bash
pottery cr apply --project-id <id> --cr-id <cr-id>
```

**Behavior:**
- Executes the CR and updates the product graph
- Creates new versions of modified nodes
- Validates DAG constraints (no cycles)
- Marks CR as Applied
- Creates new version snapshot

**Example Output:**
```
🔄 Applying CR-001 to project proj_7x9k2m4n...
  ✓ Created Feature-024: User Authentication
  ✓ Created 5 new Tasks
  ✓ Updated Feature-003@v1 → Feature-003@v2
  ✓ Added 3 dependency edges
  ✓ Validated DAG (no cycles detected)

✨ Product graph updated successfully!

📊 View changes: pottery view --project-id proj_7x9k2m4n
```

#### Delete Change Request
```bash
pottery cr delete --project-id <id> --cr-id <cr-id>
```

**Behavior:**
- Deletes a pending CR
- Only works for pending CRs (not applied)
- Applied CRs are preserved in history

**Example Output:**
```
✓ Deleted pending ChangeRequest CR-003
```

**Error Case:**
```
✗ Error: Cannot delete applied ChangeRequest
  CR-001 was applied 5 minutes ago
  Applied CRs are preserved in history
```

---

## Web UI (Read-Only Visualization)

**MVP Implementation Status:**
- ✅ **Graph View** - Fully implemented
- ⏸️ **Change Requests View** - Deferred (described below for future reference)
- ⏸️ **History View** - Deferred (described below for future reference)

### URL Structure
```
http://localhost:3000/                    # Home page (project list)
http://localhost:3000/projects/<project-id>  # Project graph view
```

### Main Layout (MVP)

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Projects                                  │
│ Project: proj_7x9k2m4n                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│              Graph View (full screen)                │
│                                                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│         Side Panel (appears when node clicked)       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Views

#### 1. Graph View (Default) ✅ IMPLEMENTED

**Purpose:** Interactive visualization of the entire product graph

**Features:**
- Interactive DAG visualization
- Zoom and pan controls
- Search/filter by node name or type
- Click node to open detail panel
- Hover to highlight dependencies

**Node Colors:**
- ProductIntent: Purple
- SubIntent: Blue
- Feature: Green
- Task: Orange
- UXSpec: Pink

**Edge Styles:**
- Requires: Solid line
- Blocks: Dashed line
- Impacts: Dotted line
- Supersedes: Bold line with arrow

**Controls:**
- Zoom in/out buttons
- Fit to screen button
- Search box (filters visible nodes)
- Node type filter checkboxes
- Reset view button

#### 2. Node Detail Panel ✅ IMPLEMENTED

**Triggered by:** Clicking any node in graph view

**Content Example:**
```
┌─ Feature-024: User Authentication ─────┐
│ Version: v1.0                           │
│ Created: CR-001 (2 days ago)            │
│                                         │
│ Description:                            │
│ Implement JWT-based authentication...   │
│                                         │
│ Linked Intent: SubIntent-02 (Security)  │
│                                         │
│ UX Spec:                                │
│ └─ uxspec-012: Login experience         │
│                                         │
│ Tasks (5):                              │
│ ├─ Task-089: JWT auth service           │
│ ├─ Task-090: Login/signup UI            │
│ ├─ Task-091: Password hashing           │
│ ├─ Task-092: Session management         │
│ └─ Task-093: Auth tests                 │
│                                         │
│ Dependencies:                           │
│ Requires:                               │
│ └─ Feature-003: API Gateway             │
│ Required by:                            │
│ └─ Feature-007: User Dashboard          │
│ Impacts:                                │
│ └─ Feature-010: Admin Panel             │
│                                         │
│ Version History:                        │
│ └─ v1.0 (current) - Created via CR-001  │
│                                         │
│ [Close]                                 │
└─────────────────────────────────────────┘
```

**Fields Shown (varies by node type):**

For **ProductIntent:**
- ID, version
- Name, description
- Linked SubIntents
- Version history

For **SubIntent:**
- ID, version
- Name, parent intent
- Linked Features
- Version history

For **Feature:**
- ID, version
- Name, description
- Linked Intent
- UX Spec (if exists)
- Tasks list
- Dependencies (requires, required by, impacts, blocks)
- Version history

For **Task:**
- ID, version
- Type (backend/frontend/test/infra)
- Description
- Parent Feature
- Dependencies
- Version history

For **UXSpec:**
- ID
- Linked Feature
- Experience goal
- Design references

#### 3. Change Requests View

**⏸️ Status: Deferred to post-MVP**

This view is described for future implementation. In MVP, use CLI commands to manage CRs.

**Planned Layout:**
```
┌─── Change Requests ──────────────────────┐
│                                           │
│ Pending (2)                               │
│ ┌─────────────────────────────────────┐   │
│ │ CR-003: Add payment integration     │   │
│ │ Created: 2 hours ago                │   │
│ │ • 4 new nodes                       │   │
│ │ • 3 modified nodes                  │   │
│ │ [View Details]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ CR-001: Add user authentication     │   │
│ │ Created: 1 day ago                  │   │
│ │ • 6 new nodes                       │   │
│ │ • 2 modified nodes                  │   │
│ │ [View Details]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ Applied (5)                               │
│ ┌─────────────────────────────────────┐   │
│ │ CR-002: Update API error handling   │   │
│ │ Applied: 2 days ago                 │   │
│ │ [View Details]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ CR-000: Initial project structure   │   │
│ │ Applied: 3 days ago                 │   │
│ │ [View Details]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
```

**Each CR Card Shows:**
- CR ID and description
- Status (Pending or Applied with timestamp)
- Summary stats (X new nodes, Y modified)
- View Details button

**Details Panel (when clicking View Details):**
Shows full CR information similar to `pottery cr show` output:
- All new nodes (expandable tree)
- All modified nodes (with version changes)
- New dependencies
- Impact map
- For pending CRs: reminder to use CLI to apply/delete

#### 4. History View

**⏸️ Status: Deferred to post-MVP**

This view is described for future implementation. In MVP, version snapshots are stored but not visualized.

**Planned Layout:**
```
┌─── Version History ──────────────────────┐
│                                           │
│ v3 - Current                              │
│ ├─ Applied CR-002: Update error handling  │
│ ├─ 2 days ago                             │
│ └─ 2 nodes modified                       │
│                                           │
│ v2                                        │
│ ├─ Applied CR-001: User authentication    │
│ ├─ 3 days ago                             │
│ └─ 6 nodes added, 2 modified              │
│                                           │
│ v1                                        │
│ ├─ Applied CR-000: Initial structure      │
│ ├─ 4 days ago                             │
│ └─ 45 nodes created                       │
│                                           │
│ v0 - Initial                              │
│ └─ Project created                        │
│                                           │
└───────────────────────────────────────────┘
```

**Features:**
- Click any version to see graph snapshot at that point
- Compare two versions (shows diff)
- Each version entry links to the CR that created it

---

## Storage Structure

```
~/.pottery/
  projects/
    proj_7x9k2m4n/
      metadata.json           # Project name, created date, etc.
      graph.json              # Current graph state (all nodes and edges)
      change-requests/
        CR-000.json           # Initial structure (pending until applied)
        CR-001.json           # Applied CR
        CR-002.json           # Applied CR
        CR-003.json           # Pending CR
      versions/
        v0.json               # Empty graph snapshot (project creation)
        v1.json               # Graph after CR-000 applied
        v2.json               # Graph after CR-001 applied
        v3.json               # Graph after CR-002 applied
    proj_3a8f1x2p/
      ...
    proj_9m2k5n7q/
      ...
```

### File Formats

#### metadata.json
```json
{
  "project_id": "proj_7x9k2m4n",
  "name": "Collaborative task management app",
  "created_at": "2025-11-07T10:30:00Z",
  "last_modified": "2025-11-10T14:22:00Z",
  "current_version": "v2"
}
```

**Note:** Newly created projects start at `"current_version": "v0"` (empty graph). After applying CR-000 (initial structure), version becomes "v1".

#### graph.json
Contains complete graph state:
- All nodes (ProductIntent, SubIntents, Features, Tasks, UXSpecs)
- All edges (Dependencies)
- Current version number

#### CR-XXX.json
Contains ChangeRequest data:
- CR metadata (id, status, created_at, applied_at)
- Description
- New nodes to create
- Existing nodes to modify
- Dependencies to add
- Impact analysis results

#### versions/vX.json
Snapshot of graph.json at specific version for history/diff

---

## Design Principles

### CLI
- **Explicit over implicit**: Always require `--project-id` for clarity
- **AI-first**: User describes intent, AI handles structure
- **Clear feedback**: Rich visual output showing exactly what will happen
- **Safe by default**: Changes go through CR review before applying
- **Scriptable**: All commands can be automated

### Web UI
- **Read-only in MVP**: No editing capabilities (keeps implementation simple)
- **Exploration-focused**: Make it easy to understand the entire product
- **Context-rich**: Show all relationships, dependencies, and impacts
- **Responsive**: Graph should work with 100s of nodes
- **No authentication needed**: Local-only server for MVP

---

## Command Summary

| Command | Purpose |
|---------|---------|
| `pottery create --intent "..."` | Create new project (generates CR-000) |
| `pottery list` | List all projects |
| `pottery delete --project-id <id>` | Delete a single project |
| `pottery delete --all` | Delete all projects |
| `pottery serve --project-id <id> [--port 3000]` | Start web server (background) |
| `pottery serve list` | List running servers |
| `pottery serve stop [--port <port>]` | Stop server(s) |
| `pottery change --project-id <id> "..."` | Create change request |
| `pottery cr list --project-id <id>` | List all CRs |
| `pottery cr show --project-id <id> --cr-id <cr-id>` | View CR details |
| `pottery cr apply --project-id <id> --cr-id <cr-id>` | Apply CR to graph |
| `pottery cr delete --project-id <id> --cr-id <cr-id>` | Delete pending CR |

---

## Out of Scope for MVP

**Not Yet Implemented:**
- Change Requests view in web UI (use CLI instead)
- Version history view in web UI (files stored but not visualized)
- In-browser graph editing (read-only for MVP)
- Multiple project tabs/navigation

**Future Features:**
- Task execution (agents running tasks)
- Real-time collaboration
- Status/priority workflow UI
- Metrics dashboards
- Effort estimation displays
- Concurrent CR conflict resolution UI
- Authentication/authorization
- Multi-user support
- Project sharing/export
