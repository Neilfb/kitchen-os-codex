# Codex Prompt Template – Kitchen OS / AllerQ

```ts
/// @codex-prompt
/// @context: Kitchen OS – Project AllerQ
/// @priority: {high|medium|low}
/// @task-type: {feature|bugfix|refactor|infra|QA|design|docs}
/// @description: {one-line goal}
/// @rules: Follow CODEX_RULES.md strictly
/// @fallback: Ask user only if schema is missing or ambiguous
```

### Usage Guidelines
- Start every Codex task with the header above.
- Replace placeholders with the task’s actual priority, type, and description.
- Assume the rules in `/rules/CODEX_RULES.md` are always in effect.
- Use this template for all future Codex prompts unless a task explicitly overrides it.

_Last updated: 2025-09-27_
