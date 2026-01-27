# Contributing Guide

This project uses the **GitFlow** workflow to manage development.

## Branch Structure

### Main Branches

| Branch | Purpose |
|------|-----------|
| `main` | Production code, always stable |
| `develop` | Integration branch for development |

### Supporting Branches

| Prefix | Purpose | Created from | Merged to |
|---------|-----------|---------------|--------------|
| `feature/*` | New features | develop | develop |
| `release/*` | Prepare new version | develop | main + develop |
| `hotfix/*` | Urgent production fix | main | main + develop |

## Workflow

### Create a new feature

```bash
# From develop, create feature branch
git checkout develop
git checkout -b feature/feature-name

# Work on the feature...
# Make commits with descriptive messages

# When ready, merge to develop
git checkout develop
git merge --no-ff feature/feature-name
git branch -d feature/feature-name
git push origin develop
```

### Prepare a release

```bash
# From develop, create release branch
git checkout develop
git checkout -b release/1.0.0

# Make final adjustments (bump version, changelog, etc.)

# Merge to main and tag
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"

# Also merge to develop
git checkout develop
git merge --no-ff release/1.0.0

# Clean up
git branch -d release/1.0.0
git push origin main develop --tags
```

### Create a hotfix

```bash
# From main, create hotfix branch
git checkout main
git checkout -b hotfix/fix-description

# Fix the problem...

# Merge to main and tag
git checkout main
git merge --no-ff hotfix/fix-description
git tag -a v1.0.1 -m "Hotfix 1.0.1"

# Also merge to develop
git checkout develop
git merge --no-ff hotfix/fix-description

# Clean up
git branch -d hotfix/fix-description
git push origin main develop --tags
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting changes (don't affect code)
- `refactor:` Code refactoring
- `test:` Add or modify tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add user authentication
fix: resolve login redirect issue
docs: update installation instructions
refactor: simplify data processing logic
```

## Pull Requests

1. Create your branch from `develop` (or `main` for hotfixes)
2. Ensure the code compiles without errors
3. Clearly describe the changes in the PR
4. Request code review
5. Once approved, merge using "Squash and merge" or "Merge commit"
