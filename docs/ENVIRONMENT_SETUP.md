---
title: Environment Variables Setup
audience: [developers]
related: [GETTING_STARTED.md]
status: current
updated: 2026-04-02
---

# Environment Variables Setup

This document explains how environment variables are managed in CurrIA to prevent accidental commits of secrets.

## Security Model

CurrIA uses a **strict separation** between:

1. **Template files** (committed to git with placeholder values)
   - `.env.example` - Template for local development
   - `.env.staging.example` - Template for staging/production values

2. **Local files** (ignored by git, never committed)
   - `.env` - Your local development secrets
   - `.env.local` - Local overrides
   - `.env.*.local` - Environment-specific overrides

## Setup Instructions

### First Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/curria.git
cd curria

# 2. Copy the template to create your local .env
cp .env.example .env

# 3. Fill in your actual secrets
# Edit .env and replace all "replace_me" values with real values:
#   - CLERK_SECRET_KEY
#   - OPENAI_API_KEY
#   - Database credentials
#   - Other API keys
nano .env

# 4. Verify your secrets are loaded
npm run dev

# 5. Install git hooks (prevents accidental commits)
npx husky install
```

### What Goes Where

**`.env.example` (template, committed to git)**
```bash
CLERK_SECRET_KEY=sk_test_replace_me          # ← Placeholder
OPENAI_API_KEY=sk-replace_me                 # ← Placeholder
DATABASE_URL=postgresql://.../@localhost     # ← Example
```

**`.env` (your local file, NOT committed)**
```bash
CLERK_SECRET_KEY=sk_live_abc123xyz...        # ← Real secret
OPENAI_API_KEY=sk-proj-real-key...           # ← Real secret
DATABASE_URL=postgresql://.../@production    # ← Real URL
```

### Common Tasks

**Add a new environment variable**

1. Add to `.env.example` with placeholder:
   ```bash
   MY_NEW_API_KEY=replace_me
   ```

2. Add to your `.env` with real value:
   ```bash
   MY_NEW_API_KEY=real_secret_value
   ```

3. Commit the template change:
   ```bash
   git add .env.example
   git commit -m "chore: add MY_NEW_API_KEY to environment template"
   ```

**Update an existing variable**

If a secret changes (API key rotated, etc.):
```bash
# Update your local .env
nano .env
# Change: MY_API_KEY=old_value → MY_API_KEY=new_value

# .env.example stays the same (it's a template)
# No git commit needed
```

**Different environments**

Create environment-specific overrides:

```bash
# For staging-specific values:
cp .env .env.staging.local
nano .env.staging.local
# Modify as needed for staging

# For development-specific values:
cp .env .env.development.local
nano .env.development.local
# Modify as needed for development
```

Then load them:
```bash
# Use staging values
NODE_ENV=staging npm run dev

# Use development values
NODE_ENV=development npm run dev
```

## Protection Mechanisms

### 1. Git Ignore (Filesystem Level)

`.gitignore` prevents `.env` files from being added to git:
```bash
# From .gitignore
.env
.env.local
.env.production.local
.env.development.local
```

Verify it's working:
```bash
git check-ignore .env
# Output: .env is ignored (correct)
```

### 2. Git Hooks (Pre-Commit Level)

The `.husky/pre-commit` hook **blocks commits** if you accidentally try to add `.env` files:

```bash
# If you accidentally try to commit .env:
git add .env
git commit -m "oops"
# ❌ Error: .env files should not be committed!
```

**Install hooks** (one-time setup):
```bash
npx husky install
```

**Verify hooks are installed:**
```bash
ls -la .husky/
# Should show: pre-commit, pre-push, etc.
```

### 3. CI/CD Level (Optional)

If using GitHub Actions, you can add a check:
```yaml
- name: Check for committed secrets
  run: |
    if git diff --cached --name-only | grep -E "\.env"; then
      echo "❌ Error: .env file would be committed!"
      exit 1
    fi
```

## Troubleshooting

### Issue: Pre-commit hook not running

**Solution:** Ensure husky is installed:
```bash
npx husky install
npm install husky --save-dev  # If missing
```

### Issue: ".env file should not be committed" error

**Why?** The pre-commit hook caught you trying to commit `.env`

**Solution:**
```bash
# Unstage the .env file
git rm --cached .env

# Continue with your commit (without .env)
git commit -m "your message"

# Or start over
git reset
git add .  # Add only the files you want
git commit -m "your message"
```

### Issue: Need to update `.env.example`

**Process:**
```bash
# 1. Update your .env with new values
nano .env

# 2. Update the template (with placeholders)
nano .env.example

# 3. Add only .env.example
git add .env.example

# 4. Commit
git commit -m "chore: update environment template"

# .env stays local and untracked ✓
```

### Issue: Different values per developer

**Solution:** Use `.env.local` for personal overrides:
```bash
# Copy your .env to .env.local
cp .env .env.local

# Now .env.local has your personal values
# .env is team standard

# Both are ignored by git, so no conflicts
```

Load priority:
```
1. .env                (team standard)
2. .env.local          (personal override)
3. .env.${NODE_ENV}    (environment-specific)
4. .env.${NODE_ENV}.local (environment + personal)
```

## Best Practices

✅ **DO:**
- Keep `.env.example` in sync with actual variables
- Use meaningful placeholder names: `sk_replace_me` not `xxx`
- Document new variables in `.env.example`
- Review `.env.example` before committing
- Rotate secrets regularly

❌ **DON'T:**
- Commit actual `.env` files with real secrets
- Share your `.env` file with others (each person has their own)
- Use the same secret values across environments
- Check in binary/compiled secrets (only text files)
- Forget to run `npx husky install` on new machines

## File Checklist

After setup, you should have:

```
✓ .env                    (local, NOT in git, has real secrets)
✓ .env.example            (in git, has placeholders)
✓ .env.staging.example    (in git, optional for staging template)
✓ .gitignore             (includes .env and .env.*.local)
✓ .husky/pre-commit      (prevents accidental commits)
```

Check with:
```bash
git ls-files | grep ".env"
# Should show only: .env.example, .env.staging.example

ls -la | grep ".env"
# Should show: .env (not tracked), .env.example (tracked)
```

---

## Related Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - First-time setup
- [.env.example](../.env.example) - Environment template
- [.gitignore](../.gitignore) - Git ignore rules
- [.husky/pre-commit](../.husky/pre-commit) - Pre-commit hook
