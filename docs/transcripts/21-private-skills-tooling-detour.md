# Session 21: Private-skills tooling detour

Claude Code · Implementation · 1 prompt · 33 words

[← Session 20](20-design-to-code-handoff.md) · [All sessions](README.md) · [Session 22 →](22-the-greenfield-build.md)

## Prompt 78

**Summary:** Debug why the private-repo skills-install command hangs forever on this machine at the cloning step, when it works fine on another machine.

- **Phase:** Implementation
- **Human:** 33 words · ~50 s to write
- **LLM:** Opus 4.8 · Claude Code · 1 min 9 s
- **Outcome:** tooling, verification

### Prompt

> I'm trying to install skills from my private repo with "skills add https://gitlab.com/[account]/[private repository]"
> This works on my other machine, but on this one it hangs forever at the repo cloning step. Debug it

### Reply of Claude Code

Found the root cause. Let me confirm the SSH path works, since that's the fix.

---

[← Session 20](20-design-to-code-handoff.md) · [All sessions](README.md) · [Session 22 →](22-the-greenfield-build.md)
