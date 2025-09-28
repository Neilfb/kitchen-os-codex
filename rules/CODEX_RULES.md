# ✅ Codex Development Rules for kitchen-os-codex

These rules must be followed by all contributors and Codex prompts when working within the kitchen-os-codex monorepo.

⸻

## 🔐 1. NoCodeBackend Schema First

Always audit the known NoCodeBackend (NCB) schema before implementing or editing any helper, API handler, or backend logic.
- 📌 NCB Instance: 48346_allerq
- 🔗 Schema Reference: stored locally & available on request
- ⛔ No guessing field names or types.

⸻

## 🚫 2. No Workarounds Without Schema Compatibility

Never implement workarounds unless absolutely necessary and schema-compatible changes are impossible.
- If an issue arises due to a schema mismatch, first recommend a schema update.
- Document all workarounds with `// TEMPORARY` and an issue reference.

⸻

## ⚙️ 3. Codex-Only Dev Tasks

All development tasks must run via Codex unless:
- It is explicitly impossible.
- The task is outside the dev workflow (e.g., Miro diagrams).

Codex prompts must:
- Begin with the standard rules header
- Assume context from CODEX_RULES.md
- Integrate any supplemental instructions (even those outside code blocks) directly into the prompt or resulting implementation without requiring additional user input.

⸻

## 🧪 4. Strict Payload & Interface Validation
- Define input interfaces for all helpers.
- Validate payloads before calling backend or API logic.
- Always stringify nested objects for NCB longtext fields (e.g., `assigned_restaurants`).

⸻

## 🧩 5. Database Logic Must Match Schema

All backend API calls (create, update, query) must:
- Match field names, types, and required/default values.
- Return appropriate success/error responses.
- Avoid sending unrecognised fields.

⸻

## 🔄 6. Field Handling Best Practices

| Field                 | Format Example                  | Notes                                                  |
|-----------------------|---------------------------------|--------------------------------------------------------|
| `uid`                 | bcrypt hash or auth UID         | Must match `uid` field on users table                  |
| `assigned_restaurants`| JSON stringified array          | Stored as longtext, must stringify manually            |
| `role`                | `admin`, `staff`, `manager`, etc.| Must match enum defined in NCB                         |

⸻

## 🛠️ 7. Example Codex Prompt Header

```ts
// Codex prompt – rules
// 1. Always audit NCB schema before implementing any helper
// 2. Never use workaround unless schema-compatible change is impossible
// 3. Use Codex for all code tasks unless explicitly impossible
// 4. Always include payload/interface validation
// 5. All database logic must conform to known NoCodeBackend schema (Instance: 48346_allerq)
```

⸻

## 📦 8. Future Automation Suggestions
- Use Codex CLI or templates to embed these rules in every prompt.
- Auto-lint for compliance with payload/interface standards.
- Track workaround count per feature for technical debt visibility.

⸻

_File: `/rules/CODEX_RULES.md`_

_Last updated: 2025-09-27_
