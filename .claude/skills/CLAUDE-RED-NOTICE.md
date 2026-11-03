# Claude-Red skills — source & notice

Third-party offensive-security skill collection, installed at the user's request.

- **Source:** https://github.com/SnailSploit/Claude-Red
- **Commit:** a8de813edc9f66f60d44cfe42d47750e89d9930b (main, fetched 2026-10-31)
- **License:** MIT (see upstream `LICENSE`)
- **Installed to:** `.claude/skills/<skill-name>/SKILL.md` (79 skills, flattened from `Skills/<category>/<skill>/`)
- **Why flattened:** Claude Code only discovers `.claude/skills/<skill-name>/SKILL.md`; the upstream
  `Skills/<category>/...` nesting is not auto-loaded by Claude Code.

## Scope

79 skills across 23 categories: web (16), wireless (14), infrastructure (7), exploit-dev (6),
fuzzing (4), post-exploitation (3), active-directory, api, auth, cicd, container, crypto,
forensics, privesc, recon, social-engineering, supply-chain, utility (2 each), ai, cloud, iot,
mobile, network (1 each).

## Safety notes

- These files are **instructions Claude will follow** when a skill triggers. Review a skill before
  relying on it in any engagement.
- Content includes detection evasion, post-exploitation, C2, social-engineering and prompt-injection
  methodology. Use only in an **authorized** context (signed pentest engagement, bug bounty scope,
  CTF, or research on systems you own).
- The frontmatter `description` of every skill is loaded into the model's context each session
  (see size note below). Descriptions are long; this costs context in every session.

## Removal

Delete the skill directories and this file:

```powershell
Get-Content .claude\skills\CLAUDE-RED-NOTICE.md
# remove only the offensive-* skill folders
Get-ChildItem .claude\skills -Directory -Filter 'offensive-*' | Remove-Item -Recurse -Force
Remove-Item .claude\skills\CLAUDE-RED-NOTICE.md
```
