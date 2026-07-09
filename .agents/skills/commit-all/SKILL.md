---
name: commit-all
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
metadata:
  internal: true
description: Create a git commit with everything
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, stage all the modified and untracked files, then create a single git commit.
