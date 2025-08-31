# Security Documentation

This document outlines the security practices and tools implemented in this project.

## Local Security Testing

Run comprehensive security checks locally before pushing to GitHub:

```bash
# Install security scanning tools
make setup-security

# Run all security checks (mirrors GitHub Actions)
make test-security

# Run individual security checks
make test-security-secrets      # TruffleHog secret scanning  
make test-security-sast        # Semgrep static analysis
make test-security-iac         # Checkov infrastructure scanning
make test-security-backend     # pip-audit + bandit
make test-security-frontend    # npm audit
```

## Security Tools Used

### 1. **TruffleHog** - Secret Scanning
- Scans git history for exposed secrets
- Same tool used in GitHub Actions pipeline
- Results stored in `.security-reports/trufflehog-local.json`

### 2. **Semgrep** - Static Application Security Testing (SAST)
- Comprehensive security analysis with multiple rulesets:
  - `p/security-audit` - General security vulnerabilities
  - `p/secrets` - Secret detection patterns
  - `p/owasp-top-ten` - OWASP Top 10 vulnerabilities  
  - `p/javascript` - JavaScript-specific security issues
  - `p/python` - Python-specific security issues
- Results stored in `.security-reports/semgrep-local.json`

### 3. **Checkov** - Infrastructure as Code Security
- Scans Dockerfiles, Kubernetes manifests, and YAML files
- Identifies infrastructure security misconfigurations
- Results stored in `.security-reports/checkov-local.json`

### 4. **Bandit** - Python Code Security
- Scans Python backend code for security issues
- Results stored in `backend/security-report.json`

### 5. **npm audit** - Node.js Dependency Security
- Scans frontend dependencies for known vulnerabilities
- Part of the standard npm toolchain

## Security Gate Policy

The security pipeline enforces the following thresholds:

- **Critical Issues**: Any critical security finding fails the pipeline
- **High Issues**: More than 15 high-severity findings triggers a warning
- **Verified Secrets**: Any verified secret exposure fails the pipeline

## Fixed Security Issues

### Command Injection Vulnerability (CVE-2024-XXXX)
**File**: `frontend/src/__tests__/run-comprehensive-tests.js:177`

**Issue**: Semgrep detected potential command injection in `spawn()` call where the command parameter was derived from user input.

**Fix Applied**: 
- Implemented command resolution pattern instead of passing user input directly
- Added comprehensive argument validation with dangerous pattern detection
- Used fixed command paths resolved from allowlist
- Explicitly disabled shell execution (`shell: false`)

**Security Measures**:
```javascript
// Before: Potentially unsafe
const child = spawn(cmd, args, { shell: false });

// After: Secure command resolution
const resolvedCmd = resolveCommandFromAllowlist(requestedCmd);
const child = spawn(resolvedCmd, args, { shell: false });
```

## Development Workflow

1. **Before Committing**: Run `make test-security` to catch issues locally
2. **CI/CD Pipeline**: GitHub Actions runs the same security checks
3. **Security Reports**: All reports stored in `.security-reports/` (gitignored)
4. **Continuous Monitoring**: Security tools updated regularly

## Security Best Practices

- Never hardcode secrets in source code
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Keep dependencies updated (`npm audit fix`, `pip-audit`)
- Follow principle of least privilege for Docker containers
- Use non-root users in production containers

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Contact the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for fixing before public disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Semgrep Rules Documentation](https://semgrep.dev/docs/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [Checkov Documentation](https://www.checkov.io/)