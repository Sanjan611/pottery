// Prompt for decomposing features into tasks

function DecomposeFeatureToTasks(
  feature_name: string,
  feature_description: string,
  context: string  // Related features and constraints
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
    - Be specific and concrete

    {{ ctx.output_format }}
  "#
}

test TestDecomposeSimpleFeature {
  functions [DecomposeFeatureToTasks]
  args {
    feature_name "User Authentication"
    feature_description "Allow users to sign up and log in with email and password"
    context "This is for a web application using REST API"
  }
  @@check(
    has_minimum_tasks,
    {{ this|length >= 3 }}
  )
  @@check(
    has_maximum_tasks,
    {{ this|length <= 10 }}
  )
  @@check(
    has_tasks,
    {{ this|length > 0 }}
  )
  @@check(
    reasonable_latency,
    {{ _.latency_ms < 15000 }}
  )
  @@assert(
    {{ _.checks.has_minimum_tasks and _.checks.has_maximum_tasks }}
  )
}

test TestDecomposeComplexFeature {
  functions [DecomposeFeatureToTasks]
  args {
    feature_name "Payment Processing"
    feature_description "Integrate Stripe for subscription payments with webhook handling"
    context #"
      The application already has user authentication.
      Need to handle monthly and annual subscriptions.
      Must comply with PCI DSS requirements.
    "#
  }
  @@check(
    has_minimum_tasks,
    {{ this|length >= 3 }}
  )
  @@check(
    has_multiple_tasks,
    {{ this|length >= 5 }}
  )
  @@check(
    reasonable_latency,
    {{ _.latency_ms < 20000 }}
  )
  @@assert(
    {{ _.checks.has_minimum_tasks and _.checks.reasonable_latency }}
  )
}
