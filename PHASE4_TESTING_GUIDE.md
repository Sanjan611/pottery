# Phase 4 Testing Guide

This guide provides step-by-step instructions for testing Phase 4: Cross-Layer Dependency Analysis functionality.

## Prerequisites

1. **Build all packages**:
   ```bash
   cd /Users/sanjandas/Documents/Projects/pottery
   pnpm install
   pnpm build
   ```

2. **Link CLI** (if not already linked):
   ```bash
   cd packages/cli
   npm link
   cd ../..
   ```

3. **Set up API key** (for AI features):
   ```bash
   export OPENAI_API_KEY="sk-..."  # or
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

4. **Create a layered test project** (if you don't have one):
   ```bash
   pottery create --intent "Build a collaborative task management app with real-time sync, user authentication, and offline support" --layered
   ```
   
   Note the project ID from the output (e.g., `proj_7x9k2m4n`)

5. **Apply the initial CR** (CR-000):
   ```bash
   pottery cr apply --project-id <your-project-id> --cr-id CR-000
   ```

---

## Test 1: Impact Analysis

### 1.1 Analyze Impact of an Epic

**Goal**: Test impact analysis on a narrative layer node (Epic)

**Steps**:
1. First, find an Epic ID from your project:
   ```bash
   pottery show --project-id <project-id> --layer narrative
   ```
   Look for an Epic ID (starts with `epic-`)

2. Run impact analysis:
   ```bash
   pottery analyze impact --project-id <project-id> --node-id <epic-id>
   ```

**Expected Output**:
- Shows target node name and layer (Narrative)
- Lists affected nodes by layer:
  - 📖 Narrative Layer: X node(s)
  - 🔗 Structure Layer: X node(s)
  - ⚙️ Specification Layer: X node(s)
- Shows specific impacts:
  - 🔄 Impacted Flows
  - 💡 Impacted Capabilities
  - 📋 Impacted Requirements
  - ✅ Impacted Tasks
- Shows cross-layer dependencies
- Total affected nodes count

**Verify**:
- ✅ Output is color-coded by layer
- ✅ All affected nodes are listed
- ✅ Cross-layer dependencies are shown
- ✅ No errors occur

---

### 1.2 Analyze Impact of a Capability

**Goal**: Test impact analysis on a structure layer node (Capability)

**Steps**:
1. Find a Capability ID:
   ```bash
   pottery show --project-id <project-id> --layer structure --graph feature
   ```
   Look for a Capability ID (starts with `cap-`)

2. Run impact analysis:
   ```bash
   pottery analyze impact --project-id <project-id> --node-id <capability-id>
   ```

**Expected Output**:
- Similar structure to Epic analysis
- Should show impacts in Specification layer (requirements, tasks)
- May show impacts in Narrative layer (linked user stories)
- May show impacts in Flow graph (through mappings)

**Verify**:
- ✅ Shows impacts across multiple layers
- ✅ Correctly identifies downstream dependencies
- ✅ Shows related flow actions through mappings

---

### 1.3 Analyze Impact of a Task

**Goal**: Test impact analysis on a specification layer node (Task)

**Steps**:
1. Find a Task ID:
   ```bash
   pottery show --project-id <project-id> --layer specification
   ```
   Look for a Task ID (starts with `task-`)

2. Run impact analysis:
   ```bash
   pottery analyze impact --project-id <project-id> --node-id <task-id>
   ```

**Expected Output**:
- Shows impacts primarily in Specification layer
- May show upstream impacts (what this task depends on)
- May show downstream impacts (what depends on this task)

**Verify**:
- ✅ Correctly identifies both upstream and downstream dependencies
- ✅ Shows within-layer dependencies

---

## Test 2: Cross-Layer Dependencies

### 2.1 View Cross-Layer Dependencies for a Node

**Goal**: Test the dependencies command to see cross-layer relationships

**Steps**:
1. Choose a node (Epic, Capability, or Task)
2. Run dependencies analysis:
   ```bash
   pottery analyze dependencies --project-id <project-id> --node-id <node-id>
   ```

**Expected Output**:
- Table showing:
  - Dependency Type (narrative_to_structure, structure_to_spec, etc.)
  - From Node (name and ID)
  - To Node (name and ID)
  - Rationale

**Verify**:
- ✅ Shows all cross-layer dependencies involving the node
- ✅ Rationale is displayed for each dependency
- ✅ Node names are human-readable (not just IDs)

---

## Test 3: Trace Dependencies

### 3.1 Trace from Epic to Implementation

**Goal**: Test forward trace from narrative to specification layer

**Steps**:
1. Get an Epic ID (from Test 1.1)
2. Run trace:
   ```bash
   pottery trace --project-id <project-id> --from <epic-id>
   ```

**Expected Output**:
- Shows full dependency path: Epic → User Stories → Capabilities → Requirements → Tasks
- Breakdown by type:
  - 📖 User Stories
  - 💡 Capabilities
  - 🔄 Flow Actions
  - 📋 Technical Requirements
  - ✅ Tasks
- Shows complete path with all node IDs
- Total nodes in trace

**Verify**:
- ✅ Path is complete (Epic → Tasks)
- ✅ All intermediate nodes are shown
- ✅ Flow actions are included (through mappings)
- ✅ Path makes logical sense

---

### 3.2 Trace from Task to Epic (Reverse)

**Goal**: Test reverse trace from specification to narrative layer

**Steps**:
1. Get a Task ID (from Test 1.3)
2. Run reverse trace:
   ```bash
   pottery trace --project-id <project-id> --from <task-id> --reverse
   ```

**Expected Output**:
- Shows reverse path: Task → Requirements → Capabilities → User Stories → Epic
- Similar breakdown as forward trace
- Shows how implementation traces back to user intent

**Verify**:
- ✅ Path goes from Task back to Epic
- ✅ All layers are represented
- ✅ Shows complete traceability

---

## Test 4: Enhanced Change Request Workflow

### 4.1 Create Change Request with Impact Analysis Info

**Goal**: Test that change command shows impact analysis availability

**Steps**:
1. Create a change request:
   ```bash
   pottery change --project-id <project-id> "Add user profile editing with avatar upload"
   ```

**Expected Output**:
- Shows CR creation message
- Displays CR summary
- For layered projects, shows:
  - 📊 Impact Analysis section
  - Note about cross-layer impact analysis availability
  - Suggestion to use `pottery analyze impact` command

**Verify**:
- ✅ Impact analysis information is shown
- ✅ Helpful commands are suggested
- ✅ CR is created successfully

---

### 4.2 View Change Request with Impact Analysis

**Goal**: Test that CR show command displays impact analysis when available

**Steps**:
1. View a change request:
   ```bash
   pottery cr show --project-id <project-id> --cr-id <cr-id>
   ```

**Expected Output** (if impact analysis is present):
- Standard CR details
- Impact Analysis section showing:
  - Affected nodes by layer
  - Impacted flows, capabilities, requirements, tasks
  - Total affected nodes
- Cross-Layer Changes section (if available)

**Note**: Currently, impact analysis is not automatically generated by AI. This will be added when BAML prompts are updated. The display infrastructure is ready.

**Verify**:
- ✅ CR details are shown correctly
- ✅ Impact analysis section appears (if data exists)
- ✅ Formatting is clear and readable

---

## Test 5: Error Handling

### 5.1 Test with Invalid Node ID

**Steps**:
```bash
pottery analyze impact --project-id <project-id> --node-id invalid-node-id
```

**Expected**: Error message indicating node not found

---

### 5.2 Test with Legacy Project

**Steps**:
1. Create a legacy (non-layered) project:
   ```bash
   pottery create --intent "Test project"  # No --layered flag
   ```

2. Try to run impact analysis:
   ```bash
   pottery analyze impact --project-id <legacy-project-id> --node-id <node-id>
   ```

**Expected**: Error message indicating impact analysis is only available for layered projects

---

### 5.3 Test with Missing Parameters

**Steps**:
```bash
pottery analyze impact --project-id <project-id>
# Missing --node-id
```

**Expected**: Commander.js shows help/error about missing required option

---

## Test 6: Integration Testing

### 6.1 End-to-End Workflow

**Goal**: Test complete workflow from change to impact analysis

**Steps**:
1. Create layered project
2. Apply initial CR
3. Analyze impact of an Epic
4. Trace from Epic to Tasks
5. Create a change request
6. View the change request
7. Analyze impact of a capability affected by the change

**Verify**:
- ✅ All commands work together
- ✅ Data flows correctly between commands
- ✅ No inconsistencies in output

---

## Expected Results Summary

After completing all tests, you should have verified:

✅ **Impact Analysis**:
- Works for all node types (Epic, Capability, Task)
- Shows correct layer categorization
- Identifies cross-layer dependencies
- Handles mappings correctly

✅ **Trace Commands**:
- Forward trace (Epic → Tasks) works
- Reverse trace (Task → Epic) works
- Shows complete paths
- Includes all intermediate nodes

✅ **Change Request Integration**:
- Shows impact analysis availability
- Displays impact data when present
- Provides helpful guidance

✅ **Error Handling**:
- Invalid inputs are caught
- Clear error messages
- Legacy projects are handled correctly

---

## Troubleshooting

### Issue: "Node not found" errors

**Solution**: Make sure you're using the correct node ID format:
- Epics: `epic-...`
- User Stories: `story-...`
- Capabilities: `cap-...`
- Flow Screens: `screen-...`
- Flow Actions: `action-...`
- Technical Requirements: `req-...`
- Tasks: `task-...`

### Issue: "Only available for layered projects"

**Solution**: Make sure you created the project with `--layered` flag and applied CR-000

### Issue: Empty impact analysis

**Solution**: This is expected if:
- The node has no dependencies
- The project is newly created with minimal structure
- Cross-layer dependencies haven't been established yet

---

## Next Steps

After testing:
1. Report any bugs or issues
2. Verify all expected outputs match actual outputs
3. Test with larger, more complex projects
4. Consider testing edge cases (circular dependencies, orphaned nodes, etc.)

---

## Quick Reference

```bash
# Impact Analysis
pottery analyze impact --project-id <id> --node-id <node-id>
pottery analyze dependencies --project-id <id> --node-id <node-id>

# Trace
pottery trace --project-id <id> --from <epic-id>
pottery trace --project-id <id> --from <task-id> --reverse

# Change Requests
pottery change --project-id <id> "description"
pottery cr show --project-id <id> --cr-id <cr-id>

# View Project
pottery show --project-id <id> --layer <narrative|structure|specification>
pottery show --project-id <id> --layer structure --graph <feature|flow>
```

