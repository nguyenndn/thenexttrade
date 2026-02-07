---
description: Automates the process of staging, committing, and pushing code to GitHub following strict Conventional Commits standards.
---

1. Analyze Status and Diff
// turbo
   - command: git status
// turbo
   - command: git diff --staged
   - Review the changes to determine the appropriate commit type and scope.

2. Stage Changes
// turbo
   - command: git add .
   - Note: If specific file staging is needed, the user should handle this manually before running the workflow.

3. Generate Commit Message
   - Create a commit message following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
   - Format: `<type>[optional scope]: <description>`
   - Types:
     - `feat`: A new feature
     - `fix`: A bug fix
     - `docs`: Documentation only changes
     - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
     - `refactor`: A code change that neither fixes a bug nor adds a feature
     - `perf`: A code change that improves performance
     - `test`: Adding missing tests or correcting existing tests
     - `build`: Changes that affect the build system or external dependencies
     - `ci`: Changes to our CI configuration files and scripts
     - `chore`: Other changes that don't modify src or test files
     - `revert`: Reverts a previous commit
   - Rules:
     - Use imperative mood ("add" not "added")
     - No period at the end
     - Keep description under 72 characters
     - Mention breaking changes if any (footer: `BREAKING CHANGE: ...`)

4. Execute Commit
   - command: git commit -m "[type]: [description]"

5. Push to GitHub
   - WARNING: This step assumes credentials are cached locally. If not, the user may need to authenticate manually.
   - command: git push origin main
