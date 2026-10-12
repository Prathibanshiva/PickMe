# PickMe — AI Agent Directives & Documentation Maintenance Rules

This file defines mandatory operational instructions for AI assistants, pairs, and automated coding agents working in the **PickMe** repository.

---

## 1. Mandatory Starting Step for Every Session

Before proposing or implementing any code changes:

1. **Read [docs/CONTEXT.md](file:///c:/Projects/PickMe/docs/CONTEXT.md) first:**
   Understand project vision, technology stack, product rules, architecture boundaries, current status, and known limitations.
2. **Read [docs/ROADMAP.md](file:///c:/Projects/PickMe/docs/ROADMAP.md) next:**
   Verify current task statuses, priorities, dependencies, and deliverables.
3. **Inspect the active Git branch and working tree:**
   Run `git branch --show-current` and `git status -s`. Never assume a branch name or clean working tree from previous conversations.
4. **Target your investigation:**
   Inspect only the files directly relevant to the requested task. Do not perform repetitive full-repository scans.

---

## 2. Persistent Documentation Maintenance Rule

**Documentation updates are part of every implementation task, not a separate or optional cleanup.**

Whenever an implementation task introduces changes to code, models, APIs, architecture, or roadmap progress, the agent MUST update the affected documentation files in the **same task**:

- **Update [docs/CHANGELOG.md](file:///c:/Projects/PickMe/docs/CHANGELOG.md):**
  For meaningful features, bug fixes, operational scripts, or architectural milestones.
- **Update [docs/API_DOCUMENTATION.md](file:///c:/Projects/PickMe/docs/API_DOCUMENTATION.md):**
  Whenever API contracts, route registrations, HTTP methods, authentication, authorization (RBAC), request parameters, responses, or error codes change.
- **Update [docs/DATABASE_SCHEMA.md](file:///c:/Projects/PickMe/docs/DATABASE_SCHEMA.md):**
  Whenever Mongoose models, fields, types, indexes, TTL rules, default values, references, or persistence boundaries change.
- **Update [docs/ROADMAP.md](file:///c:/Projects/PickMe/docs/ROADMAP.md):**
  Whenever task status, implementation priorities, acceptance criteria, or dependencies change.
- **Update [docs/CONTEXT.md](file:///c:/Projects/PickMe/docs/CONTEXT.md):**
  Whenever overall architecture, security policies, canonical product rules, completed features, known limitations, or next recommended implementation priorities change.

> **Rule:** Do not rewrite every document on minor changes. Update only the documents directly affected by the task, but always check whether `CONTEXT.md` and `ROADMAP.md` need adjustment.

---

## 3. Core Development Constraints

1. **Work on one task at a time:** Focus on the requested objective.
2. **Implement directly:** Avoid producing endless inspection outlines when asked to code.
3. **Preserve existing functionality & working tree:** Do not reset, revert, or overwrite unrelated changes.
4. **Never commit or push unless explicitly asked:** Staging, committing, and pushing require explicit user instruction.
5. **No paid third-party APIs without approval:** Never add Google Maps, Google Places, Mapbox, Twilio, or paid services without explicit approval. PickMe uses MapLibre + OpenStreetMap + native device geocoding.
6. **Honesty on system state:** Clearly distinguish mock/in-memory behavior from persisted backend behavior. Never claim a feature is completed in MongoDB when it only exists in client RAM.
7. **No secret exposure:** Never print, commit, or log credentials, JWT secrets, passwords, or private environment variables.
8. **Respect canonical product rules:** Vehicle capacities (Bike 1, Auto 3, Car 4, Sedan 4, SUV 6); shared ride seat limits (1 to `capacity - 1`); Bike excluded from shared rides; personal rides reserve whole vehicle with dedicated driver exclusivity.
