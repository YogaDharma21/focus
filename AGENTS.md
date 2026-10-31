Yoo.... I am yoga and we will work together let's understand each other
I Like minimalist thing so i really love making things in clean and simple way
I hate a lot of text and hate emojis so i prefer to use simple words when talking

## Core Directives

- **Entry Point:** On every prompt, always call skill `command-center` first to inspect state and advance the lifecycle.
- **Strict Linear Lifecycle with User Gates (No Skipping, No Chaining):**
  - Features: `scout` (grill user, wait for reply) -> `spec` (confirm spec, wait for approval) -> `slice` (confirm task DAG, wait for approval) -> `build` -> `review` -> `launch`.
  - Fixes: `debug` -> `build` -> `review` -> `launch`.
  - Planning stages (`scout`, `spec`, `slice`) must end turn and wait for user confirmation. Never chain planning into `build` in the same turn.
  - Never open PRs without `launch` (which generates PR descriptions via `pr-body`).
- **Primary Thread is Orchestrator Only:** Never execute builds, tests, file edits, or deep searches directly in the primary thread. Always delegate implementation to child sessions via `subagent`.
- **Communication Style:** Minimal, direct, telegraphic. Zero emojis. Zero em dashes (`—`) or en dashes (`–`).
- Always use user git and GitHub account.
- Give important link in response if necessary.

## Rules

### 1. Inspect & Baseline
- Inspect code, repository structure, and conventions before making changes.
- Run baseline checks when practical to spot pre-existing failures.
- Do not fix unrelated pre-existing issues unless explicitly asked.

### 2. Branching & Worktree
- Every task belongs to one working branch.
- Use semantic kebab-case branch names with standard prefixes: `feat/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`, `test/*` (e.g. `feat/session-store`, `fix/auth-token`, `chore/bump-deps`).
- NEVER prefix branches with `t3/*` or random tool prefixes.
- Do not work directly on default or protected branches.
- Stay on the branch until the task is complete.

### 3. Protect Existing Work
- Do not overwrite, reset, or stash uncommitted changes without explicit approval.
- Never use destructive git commands (`git reset --hard`, force-push, branch deletion).
- Preserve unrelated changes in the working directory.

### 4. Implement & Verify
- Implement the requested task with minimal, working code.
- Prefer existing patterns and dependencies over new ones.
- No dead code, speculative scaffolding, or excessive comments.
- Verify changes with relevant tests, linting, or builds. Never claim a check passed without running it.

### 5. Commits
- Make atomic commits per vertical slice.
- Concise, clear commit messages.
- Zero emojis. Zero em dashes (`—`) or en dashes (`–`).

### 6. PR Lifecycle & PowerShell Safety
- At most one PR per task. Check if a PR already exists before creating a new one.
- Write PR description to `.pr_description.md` (UTF-8) to avoid PowerShell multi-line string escaping errors.
- If no PR exists: `gh pr create --title "<title>" --body-file .pr_description.md`.
- If PR already exists: `gh pr edit --title "<title>" --body-file .pr_description.md`.
- Delete `.pr_description.md` immediately after creating or editing the PR.

### 7. PR Description Format
Follow the clean, pragmatic format:
- `## Overview`: 1-2 sentences on what and why.
- `## Key Changes`: Grouped bullet points on behavior and architecture.
- `## Verification`: Exact tests or checks run and output.
- `## Notes`: Optional critical trade-offs or rollback steps.

### 8. UI & Design System
- For frontend and UI work, strictly adhere to `DESIGN.md`.
- Follow the dark-first charcoal palette (`#08090b` canvas, `#121316` cards), solid matte surfaces, muted mineral accents, tabular numbers, and zero vanity pills or subtitle fluff.
