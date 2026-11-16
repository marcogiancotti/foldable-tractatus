---
name: code-reviewer
metadata:
  internal: true
description: Use when you need a comprehensive code review of complex or large changes across multiple files. Delegates to an isolated subagent for a fresh, thorough analysis. NOT for simple syntax checks or one-line fixes.
---

# Code Reviewer

Triggers a focused, isolated subagent to perform a thorough code review.

## Workflow

### OpenCode only

On first use in an OpenCode project, run the setup script once:

```bash
skills/code-reviewer/scripts/generate-opencode-agent.sh
```

This creates `.opencode/agents/code-reviewer.md` from the canonical role definition at `references/code-reviewer-instructions.md`. Then invoke the subagent with the `Task` tool (subagent_type="code-reviewer"). If you are Claude Code, skip this section entirely — it is not relevant to you.

### Claude Code only

1. Examine the changed files and their context.
2. Spawn an isolated subagent using the role defined in `references/code-reviewer-instructions.md`. Pass it a summary of the changes, relevant file paths, and any specific concerns the user raised.
3. The subagent returns a structured review with findings categorized by severity.
4. Present the review to the user.

## Rules

- Always spawn this as an isolated subagent — the review needs a clean context window with no prior session bias.
- Do not merge or summarize the subagent's output — present it as-is.
- If the subagent cannot be spawned, fall back to inline review (but note the limitation to the user).