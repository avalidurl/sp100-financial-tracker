# 🔒 Security Guide for SP500 CapEx Project

This document outlines the security measures implemented to protect API keys and sensitive data in this project.

## 🚨 CRITICAL SECURITY PRINCIPLE

**THE API KEY MUST NEVER APPEAR IN ANY CODE, CONFIGURATION FILES, OR VERSION CONTROL**

## 📋 Security Overview

This project uses the Financial Modeling Prep (FMP) API which requires an API key. We implement a zero-tolerance security approach:

- ✅ **Local Development**: Environment variables via `.env` file
- ✅ **GitHub Actions**: Repository secrets
- ✅ **Vercel Deployment**: Static site (no API key needed in production)
- ✅ **Version Control**: Comprehensive `.gitignore` protection

## 🔧 Local Development Setup

### Step 1: Copy Environment Template
```bash
cp .env.example .env
```

### Step 2: Add Your API Key
Edit `.env` and replace the placeholder:
```bash
# Replace 'your_fmp_api_key_here' with your actual API key
FMP_API_KEY=your_actual_api_key_here
```

### Step 3: Verify Security
- ✅ Confirm `.env` is in `.gitignore`
- ✅ Never commit `.env` file
- ✅ Scripts will fail gracefully if API key is missing

### Step 4: Test Local Environment
```bash
cd scripts
python fetch_data.py
```

## 🔐 GitHub Actions Security

### Setting Up Repository Secrets

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click "Settings" → "Secrets and variables" → "Actions"

2. **Add FMP_API_KEY Secret**
   - Click "New repository secret"
   - Name: `FMP_API_KEY`
   - Value: `[PASTE YOUR ACTUAL API KEY HERE]`
   - Click "Add secret"

3. **Verify Workflows**
   - Both workflows include secret validation
   - Workflows will fail early if secret is missing
   - No secret values appear in logs

### Workflow Security Features

- **Pre-flight checks**: Verify secret exists before execution
- **Environment isolation**: Secrets only available during script execution
- **Error handling**: Clear messages if secrets are missing
- **No logging**: API keys never appear in GitHub Action logs

## 🌐 Vercel Deployment Security

**IMPORTANT**: This project is a static site. The API key is NOT needed for Vercel deployment because:

- Data is fetched by GitHub Actions
- Static JSON files are committed to repository
- Vercel serves pre-generated content
- No server-side API calls in production

If you ever need environment variables in Vercel:

1. **Vercel Dashboard**
   - Go to your project in Vercel
   - Settings → Environment Variables

2. **Add Variables**
   - Name: `FMP_API_KEY`
   - Value: `[PASTE YOUR ACTUAL API KEY HERE]`
   - Environments: Production, Preview, Development

## 🔍 Security Verification Checklist

### Before Every Commit
- [ ] No API keys in any files
- [ ] `.env` is gitignored
- [ ] Scripts use `os.environ.get('FMP_API_KEY')`
- [ ] No hardcoded secrets anywhere

### Repository Security Scan
```bash
# Search for potential API key leaks
grep -r "your_actual_api_key_pattern" .
grep -r "api.*key" --include="*.py" --include="*.js" --include="*.json" .
```

### GitHub Security
- [ ] FMP_API_KEY secret is configured
- [ ] Workflows reference `${{ secrets.FMP_API_KEY }}`
- [ ] No secrets in workflow files
- [ ] Action logs don't expose secrets

## 🆘 Emergency Procedures

### If API Key is Accidentally Exposed

1. **IMMEDIATE ACTION**
   - Revoke the exposed API key at FMP dashboard
   - Generate a new API key immediately

2. **Clean Up**
   - Remove key from all exposed locations
   - Update repository secret with new key
   - Update local `.env` with new key

3. **Verify Security**
   - Run security scan on entire repository
   - Check all commit history for exposures
   - Test all environments with new key

### Key Rotation (Recommended Monthly)

1. **Generate New Key**
   - Log into FMP dashboard
   - Generate new API key

2. **Update All Locations**
   - GitHub repository secret
   - Local `.env` file
   - Any team member environments

3. **Revoke Old Key**
   - Disable previous key in FMP dashboard

## 🔧 Troubleshooting

### "ERROR: FMP_API_KEY environment variable not set!"

**Local Development:**
- Check if `.env` file exists
- Verify API key is set in `.env`
- Ensure no typos in variable name

**GitHub Actions:**
- Verify repository secret is configured
- Check secret name matches exactly: `FMP_API_KEY`
- Review workflow YAML syntax

### Scripts Work Locally But Fail in GitHub Actions
- Repository secret may not be configured
- Secret name might have typos
- Check workflow permissions

### API Calls Return Authentication Errors
- API key may be invalid or expired
- Check key format and permissions
- Verify rate limits aren't exceeded

## 📚 Additional Security Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Python dotenv Documentation](https://pypi.org/project/python-dotenv/)

## 🚀 Best Practices Summary

1. **Never commit secrets** - Use environment variables
2. **Use repository secrets** - For GitHub Actions
3. **Regular key rotation** - Monthly recommended
4. **Monitor access** - Check API usage logs
5. **Principle of least privilege** - Only necessary permissions
6. **Security scans** - Regular automated checks

---

**Remember: Security is everyone's responsibility. When in doubt, ask for a security review!**