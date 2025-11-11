// Prompt for analyzing proposed changes

function AnalyzeChange(
  current_graph: string,  // JSON representation of current graph
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

    IMPORTANT: All Features must be associated with SubIntents via the linked_intent field.

    Guidelines:
    - Be thorough in impact analysis
    - Consider cascading effects (changing one feature may impact others)
    - Identify all dependencies clearly
    - Assess risk level (Low/Medium/High)
    - Explain your reasoning
    - Keep changes focused and minimal

    {{ ctx.output_format }}
  "#
}

test TestAnalyzeSimpleChange {
  functions [AnalyzeChange]
  args {
    current_graph #"
      {
        "name": "Todo App",
        "description": "Simple todo list application",
        "features": [
          {
            "name": "Task Management",
            "description": "Create, read, update, delete tasks",
            "tasks": [
              {
                "type": "Backend",
                "description": "Create API endpoint for tasks CRUD"
              },
              {
                "type": "Frontend",
                "description": "Build task list UI component"
              },
              {
                "type": "Test",
                "description": "Write integration tests for task operations"
              }
            ]
          }
        ]
      }
    "#
    change_description "Add ability to mark tasks as completed"
  }
  @@check(
    has_description,
    {{ this.description|length > 0 }}
  )
  @@check(
    has_impact_analysis,
    {{ this.impact_analysis.reasoning|length > 0 }}
  )
  @@check(
    has_risk_level,
    {{ this.impact_analysis.risk_level in ['Low', 'Medium', 'High'] }}
  )
  @@assert(
    {{ _.checks.has_description and _.checks.has_impact_analysis }}
  )
}

test TestAnalyzeComplexChange {
  functions [AnalyzeChange]
  args {
    current_graph #"
      {
        "name": "E-commerce Platform",
        "description": "Online shopping platform",
        "features": [
          {
            "name": "Product Catalog",
            "description": "Browse and search products",
            "tasks": [
              {
                "type": "Backend",
                "description": "Product database schema"
              },
              {
                "type": "Backend",
                "description": "Search API endpoint"
              }
            ]
          },
          {
            "name": "Shopping Cart",
            "description": "Add items to cart and checkout",
            "tasks": [
              {
                "type": "Backend",
                "description": "Cart management API"
              },
              {
                "type": "Frontend",
                "description": "Cart UI component"
              }
            ]
          }
        ]
      }
    "#
    change_description #"
      Add real-time inventory tracking that updates product availability
      across the catalog and prevents adding out-of-stock items to cart
    "#
  }
  @@check(
    identifies_multiple_features,
    {{ this.impact_analysis.affected_features|length > 1 }}
  )
  @@check(
    has_new_or_modified,
    {{ (this.new_features|length + this.modified_features|length) > 0 }}
  )
  @@check(
    has_impact_reasoning,
    {{ this.impact_analysis.reasoning|length > 50 }}
  )
  @@check(
    reasonable_latency,
    {{ _.latency_ms < 20000 }}
  )
  @@assert(
    {{ _.checks.has_new_or_modified and _.checks.has_impact_reasoning }}
  )
}

test TestAnalyzeBreakingChange {
  functions [AnalyzeChange]
  args {
    current_graph #"
      {
        "name": "Social Media App",
        "description": "Social networking platform",
        "features": [
          {
            "name": "User Profiles",
            "description": "User profile management",
            "tasks": [
              {
                "type": "Backend",
                "description": "User API with username-based lookup"
              }
            ]
          },
          {
            "name": "Messaging",
            "description": "Direct messaging between users",
            "tasks": [
              {
                "type": "Backend",
                "description": "Message API using username for recipients"
              }
            ]
          }
        ]
      }
    "#
    change_description "Switch from username-based to UUID-based user identification"
  }
  @@check(
    high_impact_detected,
    {{ this.impact_analysis.risk_level in ['Medium', 'High'] }}
  )
  @@check(
    affects_multiple_areas,
    {{ this.impact_analysis.affected_features|length >= 2 }}
  )
  @@check(
    has_modifications,
    {{ this.modified_features|length > 0 or this.modified_tasks|length > 0 }}
  )
  @@assert(
    {{ _.checks.high_impact_detected and _.checks.affects_multiple_areas }}
  )
}
