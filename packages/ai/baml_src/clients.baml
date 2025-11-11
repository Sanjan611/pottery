// BAML Configuration for Pottery AI Planning

// LLM Client Configuration
client<llm> GPT4 {
  provider openai
  options {
    model gpt-4o
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
