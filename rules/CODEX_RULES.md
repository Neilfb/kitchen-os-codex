# ✅ Kitchen OS – Codex Development Rules

These rules are enforced across all development tasks within the `kitchen-os-codex` monorepo.

## 🔐 Codex Prompt Compliance Rules

1. **Schema-first**
   - Always audit the NoCodeBackend schema (`Instance: 48346_allerq`) before implementing or modifying any helper, route, or component.
   - Validate that payloads exactly match the schema. Update schema only if absolutely necessary.

2. **No workarounds**
   - Do not implement temporary fixes or schema workarounds unless a schema-compatible solution is impossible.

3. **Codex-first execution**
   - All code tasks should be implemented via Codex prompts.
   - Manual edits are only permitted if Codex is explicitly unable to complete the task.

4. **Typed validation**
   - All inputs and API payloads must be typed and validated before use.
   - Interfaces must match both the frontend and backend expectations.

5. **Full conformity to NCB**
   - All database operations must conform to the known `users`, `restaurants`, `menus`, and `menu_items` tables in NoCodeBackend.
   - Ensure use of `secret_key`, correct endpoints (`create`, `update`, `get`, `list`, etc.), and full schema compatibility.

## 🛡️ Stability

- Do not bypass or alter these rules without recording the decision in a commit message or inline code comment.

---

_These rules ensure the AllerQ app is production-grade, scalable, and consistent with the Kitchen OS platform vision._
