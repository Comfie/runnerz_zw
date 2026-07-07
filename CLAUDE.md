@AGENTS.md
# Git & Commits

- **Never commit unless the user explicitly asks.** Do not commit at the end of tasks, after writing specs, or as "checkpoints" without a direct instruction like "commit this" or "commit these changes".
- **Commit messages must be descriptive and clean.** Use conventional commit format (`fix:`, `feat:`, `docs:`, `chore:` etc.) with a clear subject line and an optional body that explains *why*, not just *what*.
- **No authored-by or co-authored-by lines.** Never add `Co-authored-by:`, `Authored-by:`, or any AI attribution lines to commit messages.


## Preferences
- Ask before committing to git
- Prefer editing existing files over creating new ones
- Run tests after making changes
- Keep code simple — no over-engineering
- No unnecessary comments or docstrings

## Workflow
- When something goes sideways, stop and re-plan — don't keep pushing
- After finishing a task: run typecheck, tests, and lint before calling it done

## Style
- Prefer small, focused functions
- Use early returns over nested conditionals

