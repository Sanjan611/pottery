// Prompt for creating initial project structure

function CreateProjectStructure(user_intent: string) -> ProductIntent {
  client GPT4

  prompt #"
    You are a product architect helping to design a software product.

    The user has provided this product intent:
    {{ user_intent }}

    Your task is to:
    1. Create a clear ProductIntent with a concise name and description
    2. Break it down into 2-5 strategic SubIntents (pillars like "User Experience", "Scalability", "Security")
    3. For EACH SubIntent, generate 2-6 Features (distinct user-facing capabilities)
    4. For each Feature, generate 3-10 Tasks (atomic units of work)
    5. Add UXSpecs where relevant for user-facing features

    IMPORTANT: Features should ONLY be defined within SubIntents, not at the ProductIntent level.

    Guidelines:
    - Tasks should be actionable and specific
    - Task types: Backend, Frontend, Test, Infrastructure
    - Dependencies should be realistic (a task can depend on other tasks)
    - Keep descriptions clear and concise
    - Focus on the MVP scope
    - Be practical and implementable

    {{ ctx.output_format }}
  "#
}

test TestCreateProjectStructure {
  functions [CreateProjectStructure]
  args {
    user_intent #"
      Create an app that allows users to manage their subscriptions.
    "#
  }
}
