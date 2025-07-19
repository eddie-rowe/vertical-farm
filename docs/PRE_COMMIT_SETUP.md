# 🚀 Pre-commit Hooks Setup Guide

This guide explains how to set up and use pre-commit hooks that mirror your GitHub workflow quality checks locally.

## 🎯 Quick Setup

```bash
# Run the automated setup script
./scripts/setup-pre-commit.sh
```

That's it! The script will install everything and configure all hooks.

---

## 📋 What Gets Installed

### ✅ **Backend Quality Checks**
- **Code Formatting**: Black (Python formatter)
- **Import Sorting**: isort (import organization)
- **Linting**: flake8 (code style and errors)
- **Type Checking**: mypy (static type analysis)
- **Security**: Bandit (security vulnerability detection)
- **Dependencies**: Safety (dependency vulnerability scanning)

### ✅ **Frontend Quality Checks**
- **Code Formatting**: Prettier (JavaScript/TypeScript formatter)
- **Linting**: ESLint (comprehensive code quality)
- **Type Checking**: TypeScript strict checking
- **Dependencies**: npm audit (vulnerability scanning)

### ✅ **Security Scanning**
- **Secret Detection**: TruffleHog + detect-secrets
- **License Compliance**: Automatic license checking

### ✅ **General Quality**
- **File Quality**: Trailing whitespace, line endings, YAML/JSON validation
- **Docker**: Dockerfile linting
- **Git**: Conventional commit message format

---

## 🛠️ Manual Setup (if needed)

### Prerequisites
```bash
# Install pre-commit
pip install pre-commit

# Install additional tools
pip install detect-secrets pip-audit
```

### Installation
```bash
# Install pre-commit hooks
pre-commit install

# Install commit message hooks
pre-commit install --hook-type commit-msg

# Create secrets baseline
detect-secrets scan --baseline .secrets.baseline
```

---

## 💡 Usage

### **Automatic (Recommended)**
Pre-commit hooks run automatically when you commit:
```bash
git add .
git commit -m "feat: add new feature"
# ↳ Hooks run automatically
```

### **Manual Execution**
```bash
# Run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run black
pre-commit run eslint

# Run hooks on specific files
pre-commit run --files backend/src/main.py frontend/src/app.tsx
```

### **Emergency Skip** (Use sparingly!)
```bash
# Skip all hooks (emergency only)
git commit --no-verify -m "fix: emergency fix"
```

---

## 🔧 Configuration Files

| **File** | **Purpose** |
|----------|-------------|
| `.pre-commit-config.yaml` | Main pre-commit configuration |
| `.secrets.baseline` | Allowed secrets for detect-secrets |
| `backend/pyproject.toml` | Python tool configuration |
| `frontend/.eslintrc.json` | ESLint configuration |
| `frontend/.prettierrc` | Prettier configuration |

---

## 🐛 Common Issues & Fixes

### **Hook Failure: "Files were modified by this hook"**
```bash
# The hook auto-fixed files, just re-commit
git add .
git commit -m "your commit message"
```

### **Black formatting issues**
```bash
# Fix automatically
cd backend && black src/ tests/
git add .
```

### **ESLint/Prettier issues**
```bash
# Fix automatically
cd frontend && npx prettier --write . && npx eslint . --fix
git add .
```

### **TypeScript errors**
```bash
# Check and fix manually
cd frontend && npx tsc --noEmit
# Fix the reported errors, then commit
```

### **Secret detection false positives**
```bash
# Add to allowlist if it's not a real secret
detect-secrets scan --baseline .secrets.baseline --force-use-all-plugins
```

### **Update hooks to latest versions**
```bash
pre-commit autoupdate
```

---

## 🎛️ Customization

### **Skip specific hooks**
```bash
# Skip specific hooks for one commit
SKIP=mypy,flake8 git commit -m "wip: work in progress"
```

### **Modify hook behavior**
Edit `.pre-commit-config.yaml` to adjust:
- Hook versions (`rev` field)
- Arguments (`args` field)
- File patterns (`files` field)

### **Add new hooks**
Add to the `repos` section in `.pre-commit-config.yaml`:
```yaml
- repo: https://github.com/example/hook-repo
  rev: v1.0.0
  hooks:
    - id: example-hook
```

---

## 📊 Performance Tips

### **Faster execution**
```bash
# Run hooks in parallel (default behavior)
pre-commit run --all-files

# Cache installation for faster subsequent runs
# (automatically handled by pre-commit)
```

### **Selective running**
```bash
# Only run on changed files (default)
pre-commit run

# Run specific hooks only
pre-commit run black eslint
```

---

## 🔍 Troubleshooting

### **Check hook status**
```bash
pre-commit --version
pre-commit hook-impl --list
```

### **Clean and reinstall**
```bash
pre-commit clean
pre-commit install --install-hooks
```

### **Debug mode**
```bash
pre-commit run --verbose --all-files
```

### **Test specific hook**
```bash
pre-commit try-repo https://github.com/psf/black black --verbose
```

---

## 🎯 Integration with IDEs

### **VS Code**
Install extensions:
- Python (Microsoft)
- Black Formatter
- Prettier - Code formatter
- ESLint

Add to `.vscode/settings.json`:
```json
{
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### **PyCharm/IntelliJ**
- Enable Black as formatter
- Enable ESLint for JavaScript/TypeScript
- Install pre-commit plugin

---

## 📈 Benefits

### **For Developers**
- ✅ **Immediate feedback** - catch issues before push
- ✅ **Consistent style** - automated formatting
- ✅ **Reduced review time** - fewer style comments
- ✅ **Learning tool** - understand best practices

### **For the Team**
- ✅ **Consistent codebase** - same standards everywhere
- ✅ **Faster CI/CD** - fewer pipeline failures
- ✅ **Better security** - automatic secret detection
- ✅ **Higher quality** - comprehensive checks

---

## 🆘 Support

### **Getting Help**
1. Check this guide first
2. Run with `--verbose` for detailed output
3. Check GitHub workflow logs for comparison
4. Create an issue with error details

### **Useful Commands**
```bash
# Get help
pre-commit --help
pre-commit run --help

# Show configuration
pre-commit run --show-diff-on-failure --all-files

# Validate configuration
pre-commit validate-config
```

---

## 🔄 Keeping Up-to-Date

### **Auto-updates**
Pre-commit hooks are automatically updated weekly via GitHub Actions.

### **Manual updates**
```bash
pre-commit autoupdate
git add .pre-commit-config.yaml
git commit -m "chore: update pre-commit hooks"
```

### **Check for updates**
```bash
pre-commit autoupdate --bleeding-edge  # Get latest versions
```

Happy coding with quality gates! 🌱✨ 