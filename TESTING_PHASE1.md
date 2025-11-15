# Phase 1 Testing Guide

This guide walks you through testing the complete Phase 1 implementation of the layered architecture.

## Prerequisites

1. **Build all packages:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Set up API key:**
   ```bash
   # For OpenAI
   export OPENAI_API_KEY="sk-..."
   
   # Or for Anthropic
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

3. **Link CLI (optional but recommended):**
   ```bash
   cd packages/cli
   npm link
   cd ../..
   ```

## Test 1: Create a Layered Project

### Step 1: Create the Project

```bash
pottery create --intent "Build a collaborative note-taking app with real-time sync" --layered
```

**Expected Output:**
- Project ID generated (e.g., `proj_abc12345`)
- AI generates three layers:
  - **Narrative Layer**: Epics and User Stories
  - **Structure Layer**: Capabilities
  - **Specification Layer**: Technical Requirements and Tasks
- CR-000 created with all layers

**What to verify:**
- ✅ Project ID is displayed
- ✅ Output shows layer breakdown (Epics, Stories, Capabilities, Requirements, Tasks)
- ✅ No errors during creation

### Step 2: Verify File Structure

Check that the layered project structure was created:

```bash
# Replace proj_abc12345 with your actual project ID
ls -la ~/.pottery/projects/proj_abc12345/
```

**Expected structure:**
```
~/.pottery/projects/proj_abc12345/
├── metadata.json
├── layers/
│   ├── narrative.json      # Epics and User Stories
│   ├── structure.json      # Capabilities
│   └── specification.json  # Technical Requirements and Tasks
├── cross-layer-deps.json   # Cross-layer dependencies
├── change-requests/
│   └── CR-000.json
└── versions/
    └── v0/
        ├── narrative.json
        ├── structure.json
        ├── specification.json
        └── cross-layer-deps.json
```

**What to verify:**
- ✅ `layers/` directory exists with all three layer files
- ✅ `cross-layer-deps.json` exists
- ✅ Version snapshots include all layers

### Step 3: Inspect Layer Files

```bash
# View narrative layer
cat ~/.pottery/projects/proj_abc12345/layers/narrative.json | jq '.nodes | keys'

# View structure layer
cat ~/.pottery/projects/proj_abc12345/layers/structure.json | jq '.nodes | keys'

# View specification layer
cat ~/.pottery/projects/proj_abc12345/layers/specification.json | jq '.nodes | keys'

# View cross-layer dependencies
cat ~/.pottery/projects/proj_abc12345/cross-layer-deps.json | jq 'keys'
```

**What to verify:**
- ✅ Narrative layer has `epic-*` and `story-*` nodes
- ✅ Structure layer has `cap-*` nodes
- ✅ Specification layer has `req-*` and `task-*` nodes
- ✅ Cross-layer dependencies exist

## Test 2: CLI Show Command

### Step 1: Show All Layers

```bash
pottery show --project-id proj_abc12345
```

**Expected Output:**
- Box with project information
- All three layers displayed:
  - 📖 Narrative Layer: X Epics, Y User Stories
  - 🔗 Structure Layer: Z Capabilities
  - ⚙️ Specification Layer: A Requirements, B Tasks
- Cross-layer dependencies count
- Version number

**What to verify:**
- ✅ All layers are shown
- ✅ Node counts are correct
- ✅ Formatting is clean

### Step 2: Show Specific Layer - Narrative

```bash
pottery show --project-id proj_abc12345 --layer narrative
```

**Expected Output:**
- Only Narrative Layer information
- Epics and User Stories counts
- Dependencies within narrative layer

**What to verify:**
- ✅ Only narrative layer shown
- ✅ No structure or specification data

### Step 3: Show Specific Layer - Structure

```bash
pottery show --project-id proj_abc12345 --layer structure
```

**Expected Output:**
- Only Structure Layer information
- Capabilities count
- Dependencies within structure layer

### Step 4: Show Specific Layer - Specification

```bash
pottery show --project-id proj_abc12345 --layer specification
```

**Expected Output:**
- Only Specification Layer information
- Technical Requirements and Tasks counts
- Dependencies within specification layer

### Step 5: Test Invalid Layer

```bash
pottery show --project-id proj_abc12345 --layer invalid
```

**Expected Output:**
- Error message about invalid layer
- List of valid layers

**What to verify:**
- ✅ Error handling works
- ✅ Helpful error message

## Test 3: Apply CR-000 and Verify

### Step 1: Review CR-000

```bash
pottery cr show --project-id proj_abc12345 --cr-id CR-000
```

**Expected Output:**
- Detailed view of CR-000
- All new nodes listed
- Layer breakdown visible

### Step 2: Apply CR-000

```bash
pottery cr apply --project-id proj_abc12345 --cr-id CR-000
```

**Expected Output:**
- CR-000 applied successfully
- New version created (v1)
- DAG validation passed

**What to verify:**
- ✅ No validation errors
- ✅ Version snapshot created in `versions/v1/`
- ✅ All layer files updated

### Step 3: Verify Version Snapshots

```bash
ls -la ~/.pottery/projects/proj_abc12345/versions/v1/
```

**Expected Output:**
- All layer files present in v1 snapshot
- Cross-layer dependencies file present

## Test 4: Web UI Visualization

### Step 1: Start the Web Server

```bash
pottery serve --project-id proj_abc12345
```

**Expected Behavior:**
- Server starts on http://localhost:3000
- Browser opens automatically
- Project graph loads

### Step 2: Test Layer Selector

**In the web UI:**

1. **Verify Layer Selector appears:**
   - Should see buttons: "All Layers", "📖 Narrative", "🔗 Structure", "⚙️ Specification"
   - Only appears for layered projects

2. **Test "All Layers" view:**
   - Click "All Layers"
   - Should see all nodes from all three layers
   - Cross-layer edges should be visible (dashed lines)

3. **Test "Narrative" layer:**
   - Click "📖 Narrative"
   - Should only see Epic and UserStory nodes
   - Edges between epics and stories visible
   - Other layers hidden

4. **Test "Structure" layer:**
   - Click "🔗 Structure"
   - Should only see Capability nodes
   - Edges between capabilities visible

5. **Test "Specification" layer:**
   - Click "⚙️ Specification"
   - Should only see TechnicalRequirement and Task nodes
   - Edges between requirements and tasks visible

**What to verify:**
- ✅ Layer selector appears for layered projects
- ✅ Each layer filter works correctly
- ✅ Nodes are properly filtered
- ✅ Edges are filtered appropriately
- ✅ Cross-layer edges visible in "All Layers" view

### Step 3: Test Node Rendering

**For each layer, verify node appearance:**

1. **Narrative Layer Nodes:**
   - Epic nodes: Purple border, show name and description
   - UserStory nodes: Purple border (lighter), show narrative text

2. **Structure Layer Nodes:**
   - Capability nodes: Green border, show name and description

3. **Specification Layer Nodes:**
   - TechnicalRequirement nodes: Orange border, show type badge and specification
   - Task nodes: Orange border, show task type and description

**What to verify:**
- ✅ All node types render correctly
- ✅ Colors match layer theme
- ✅ Node content is readable
- ✅ Node details panel works when clicking nodes

### Step 4: Test Search and Filters

1. **Search functionality:**
   - Type in search box (e.g., "sync", "user", "task")
   - Verify nodes filter correctly
   - Verify search works across all layers

2. **Node type filters:**
   - Toggle node type checkboxes
   - Verify nodes show/hide correctly
   - Test with different layer views

**What to verify:**
- ✅ Search works across all node types
- ✅ Filters work correctly
- ✅ Search respects layer selection

### Step 5: Test Cross-Layer Dependencies

**In "All Layers" view:**

1. **Find a UserStory node:**
   - Should have dashed edges to Capability nodes
   - These represent cross-layer dependencies

2. **Find a Capability node:**
   - Should have dashed edges to TechnicalRequirement nodes
   - Should have dashed edges from UserStory nodes

3. **Find a TechnicalRequirement node:**
   - Should have dashed edges to Task nodes
   - Should have dashed edges from Capability nodes

**What to verify:**
- ✅ Cross-layer edges are visible (dashed lines)
- ✅ Edges connect correct node types
- ✅ Edge colors match layer transitions

## Test 5: Compare with Legacy Project

### Step 1: Create Legacy Project

```bash
pottery create --intent "Build a simple todo app"
# Note: No --layered flag
```

**Expected:**
- Creates project with legacy structure
- Uses `graph.json` instead of `layers/` directory
- Node types: ProductIntent, SubIntent, Feature, Task

### Step 2: Verify Legacy Project Works

```bash
# Show command should work
pottery show --project-id <legacy-project-id>

# Web UI should work without layer selector
pottery serve --project-id <legacy-project-id>
```

**What to verify:**
- ✅ Legacy projects work correctly
- ✅ No layer selector in web UI for legacy projects
- ✅ All existing functionality preserved

## Test 6: Edge Cases

### Test 1: Empty Layers

Create a project and verify it handles empty layers gracefully:
- All layer files should exist even if empty
- Web UI should show empty state
- CLI should show zero counts

### Test 2: Invalid Project ID

```bash
pottery show --project-id invalid_id
```

**Expected:**
- Clear error message
- No crash

### Test 3: Missing Layer Files

(Advanced - manually delete a layer file)
- Should handle gracefully with error message

## Test 7: API Endpoints

### Test 1: Get All Layers

```bash
curl http://localhost:3000/api/projects/proj_abc12345/graph
```

**Expected:**
- JSON response with all layers combined
- `isLayered: true`
- All nodes and edges from all layers

### Test 2: Get Specific Layer

```bash
curl "http://localhost:3000/api/projects/proj_abc12345/graph?layer=narrative"
```

**Expected:**
- JSON response with only narrative layer
- `layer: "narrative"`
- Only Epic and UserStory nodes

### Test 3: Test Other Layers

```bash
# Structure layer
curl "http://localhost:3000/api/projects/proj_abc12345/graph?layer=structure"

# Specification layer
curl "http://localhost:3000/api/projects/proj_abc12345/graph?layer=specification"
```

**What to verify:**
- ✅ API returns correct layer data
- Filtering works correctly
- Response format is valid JSON

## Success Criteria

All tests should pass with:

✅ **CLI:**
- `pottery create --layered` generates three layers
- `pottery show` displays all layers correctly
- `pottery show --layer <layer>` filters correctly
- File structure matches specification

✅ **Web UI:**
- Layer selector appears for layered projects
- Each layer filter works correctly
- All node types render properly
- Cross-layer dependencies visible
- Search and filters work

✅ **API:**
- Returns layered graph data
- Layer query parameter works
- Supports both layered and legacy projects

✅ **Storage:**
- Multi-file structure created correctly
- Version snapshots include all layers
- Cross-layer dependencies stored

✅ **Backward Compatibility:**
- Legacy projects still work
- No breaking changes to existing functionality

## Troubleshooting

### Issue: "Project not found"
- Verify project ID is correct
- Check `~/.pottery/projects/` directory

### Issue: "Invalid layer"
- Use: `narrative`, `structure`, or `specification`
- Case-sensitive

### Issue: Web UI shows no nodes
- Check browser console for errors
- Verify API endpoint returns data
- Check that CR-000 was applied

### Issue: Build errors
- Run `pnpm build` from root
- Check for TypeScript errors
- Verify all dependencies installed

## Next Steps

After successful testing:
1. ✅ Phase 1 is complete
2. Ready to proceed to Phase 2 (Dual Graph Architecture)
3. Document any issues found during testing

