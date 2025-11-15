// Prompts for creating layered project structure (Phase 1)

function CreateLayeredProject(user_intent: string) -> LayeredProject {
  client GPT4

  prompt #"
    You are a product architect helping to design a software product using a three-layer architecture:

    1. NARRATIVE LAYER - Human-first, motivation-driven
       - Answers: "What are we trying to do and why?"
       - Contains: Epics (high-level themes) and User Stories

    2. STRUCTURE LAYER - Machine-reasonable, execution-oriented
       - Answers: "What needs to happen?"
       - Contains: Capabilities (what the system can do)

    3. SPECIFICATION LAYER - Precise, testable, implementable
       - Answers: "What does done look like?"
       - Contains: Technical Requirements and Tasks

    The user has provided this product intent:
    {{ user_intent }}

    Your task is to generate a complete three-layer project structure:

    NARRATIVE LAYER:
    - Create 2-4 Epics (major themes or goals)
    - For each Epic, create 3-7 User Stories in the format:
      "As a [user type], I want [goal], so that [benefit]"
    - Include 2-5 acceptance criteria per User Story
    - Link User Stories to Capabilities they require (use capability names)

    STRUCTURE LAYER:
    - Create TWO GRAPHS:
      1. FEATURE GRAPH: Capabilities (what the system can do)
         - Each Capability should have a clear name and description
         - Link Capabilities back to the User Stories they satisfy
      2. FLOW GRAPH: FlowScreens and FlowActions (user journey)
         - Create screens for major UI states
         - Create actions for user interactions
         - Model screen transitions
         - Link actions to capabilities they require
    - Create EXPLICIT MAPPINGS between FlowActions and Capabilities
      - For each FlowAction, create a FlowToCapabilityMapping entry
      - Include rationale explaining why the action needs each capability
    - Think about both features and user flows

    SPECIFICATION LAYER:
    - Create Technical Requirements (Performance, Security, Scalability, Reliability, Other)
    - Link each Technical Requirement to the Capabilities it supports
    - Create Tasks (atomic units of work: Backend, Frontend, Test, Infrastructure)
    - Tasks should be specific and actionable

    Guidelines:
    - Keep the scope focused on MVP
    - Be practical and implementable
    - Ensure all cross-layer references are consistent
    - User Stories should drive Capabilities
    - Capabilities should drive Technical Requirements
    - Technical Requirements should inform Tasks

    {{ ctx.output_format }}
  "#
}

function CreateNarrativeLayer(user_intent: string) -> NarrativeLayer {
  client GPT4

  prompt #"
    You are creating the NARRATIVE LAYER for a software product.
    This layer answers: "What are we trying to do and why?"

    User intent:
    {{ user_intent }}

    Create:
    1. 2-4 Epics (high-level themes or major goals)
    2. For each Epic, 3-7 User Stories in format:
       "As a [user type], I want [goal], so that [benefit]"
    3. For each User Story, 2-5 acceptance criteria
    4. Link User Stories to potential Capabilities (system features they need)

    Focus on user value and motivation, not implementation.

    {{ ctx.output_format }}
  "#
}

function CreateStructureLayer(narrative: NarrativeLayer) -> StructureLayer {
  client GPT4

  prompt #"
    You are creating the STRUCTURE LAYER based on the narrative layer.
    This layer answers: "What needs to happen?"

    Given these User Stories:
    {% for story in narrative.userStories %}
    - {{ story.narrative }}
      Needs capabilities: {{ story.linkedCapabilityNames }}
    {% endfor %}

    Create TWO SEPARATE GRAPHS:

    1. FEATURE GRAPH (Capabilities):
       - Create Capabilities that satisfy the User Stories above
       - Each Capability represents what the system CAN DO
       - Link Capabilities back to the User Stories they satisfy
       - Think about system features, not implementation details
       - Example capabilities: "User Authentication", "Task Creation", "Real-time Notifications"

    2. FLOW GRAPH (Screens and Actions):
       - Model the user journey through the application
       - Create FlowScreens for major UI states (e.g., "Login Screen", "Dashboard", "Task Detail")
       - Create FlowActions for user interactions on each screen
       - Each FlowAction should:
         * Have a triggerType: "user" (user-initiated) or "system" (automatic)
         * Reference a parentScreen (which screen it belongs to)
         * Optionally have a nextScreen (screen transition after action)
         * Link to Capabilities it requires (via linkedCapabilityNames)
       - FlowScreens should list their actions in actionNames array
       - Model screen transitions: when a user action leads to another screen, set nextScreen
       - Think about the user flow: login → dashboard → task detail → edit task → save → return to dashboard

    Guidelines for Flow Modeling:
    - Create screens for distinct UI states (don't over-fragment)
    - Create actions for meaningful user interactions (click, submit, navigate)
    - System actions (auto-save, notifications) should have triggerType: "system"
    - User actions (click button, submit form) should have triggerType: "user"
    - Link actions to capabilities they need (e.g., "Login" action needs "User Authentication" capability)
    - Model transitions: actions that navigate to another screen should have nextScreen set

    Example Flow:
    - Screen: "Login Screen"
      - Action: "Submit Login" (user) → nextScreen: "Dashboard"
      - Action: "Forgot Password" (user) → nextScreen: "Password Reset Screen"
    - Screen: "Dashboard"
      - Action: "View Task" (user) → nextScreen: "Task Detail"
      - Action: "Auto-refresh Tasks" (system) → no nextScreen

    Think about both what the system CAN DO (capabilities) and HOW users interact with it (flows).

    3. EXPLICIT MAPPINGS (Many-to-Many Relationships):
       - For EACH FlowAction, create explicit FlowToCapabilityMapping entries
       - Each mapping connects a FlowAction to one or more Capabilities it requires
       - IMPORTANT: Create mappings even if the FlowAction already has linkedCapabilityNames
       - For each mapping, provide a clear rationale explaining:
         * Why this specific action requires this capability
         * How the capability enables the action
         * What would break if this mapping didn't exist
       - Example mapping:
         * FlowAction: "Submit Login"
         * Capabilities: ["User Authentication"]
         * Rationale: "The Submit Login action requires the User Authentication capability to verify credentials and create a user session. Without this capability, the login action cannot complete successfully."

    MAPPING GUIDELINES:
    - Every FlowAction should have at least one mapping (even if just one capability)
    - If a FlowAction requires multiple capabilities, create a single mapping with all of them (don't create separate mappings for each)
    - The rationale should be specific and explain the dependency clearly
    - Focus on what capabilities are ESSENTIAL for the action to work, not just nice-to-have

    {{ ctx.output_format }}
  "#
}

function CreateSpecificationLayer(structure: StructureLayer) -> SpecificationLayer {
  client GPT4

  prompt #"
    You are creating the SPECIFICATION LAYER based on the structure layer.
    This layer answers: "What does done look like?"

    Given these Capabilities:
    {% for cap in structure.capabilities %}
    - {{ cap.name }}: {{ cap.description }}
    {% endfor %}

    Create:
    1. Technical Requirements (Performance, Security, Scalability, Reliability, Other)
       - Link each to the Capabilities it supports
       - Be specific and measurable

    2. Tasks (Backend, Frontend, Test, Infrastructure)
       - Atomic units of work
       - Actionable and specific
       - Realistic dependencies between tasks

    Focus on implementation details and technical precision.

    {{ ctx.output_format }}
  "#
}

test TestCreateLayeredProject {
  functions [CreateLayeredProject]
  args {
    user_intent #"
      Build a collaborative task management app where teams can create projects,
      assign tasks, track progress, and communicate in real-time.
    "#
  }
}

test TestCreateNarrativeLayer {
  functions [CreateNarrativeLayer]
  args {
    user_intent #"
      Build a collaborative task management app.
    "#
  }
}
