# 🚀 Quick Start - Secure Setup

## 🔒 SECURITY FIRST APPROACH

This project implements **zero-tolerance security** for API key management. Follow these steps for a secure setup:

### 1. One-Command Setup
```bash
# Clone and set up the project securely
git clone https://github.com/your-username/sp100-capex.git
cd sp100-capex
./setup.sh
```

### 2. Configure Your API Key
```bash
# Edit the .env file and add your API key
nano .env

# Replace this line:
FMP_API_KEY=your_fmp_api_key_here

# With your actual key:
FMP_API_KEY=your_actual_api_key_from_fmp
```

### 3. Verify Security
```bash
# Ensure .env is gitignored
git status

# Should NOT show .env file
# Should only show .env.example (if any changes)
```

### 4. Test the Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Test data fetching
cd scripts
python fetch_data.py
```

## 🛡️ Security Features

- ✅ **Environment Variables**: No hardcoded API keys
- ✅ **Git Protection**: Comprehensive .gitignore
- ✅ **GitHub Secrets**: Secure CI/CD pipeline
- ✅ **Vercel Ready**: Static deployment (no API key needed)
- ✅ **Error Handling**: Graceful failures for missing keys
- ✅ **Documentation**: Complete security guide

## 🚨 Security Checklist

Before contributing or deploying:

- [ ] No API keys in any code files
- [ ] `.env` file is gitignored
- [ ] GitHub repository secrets are configured
- [ ] All scripts use environment variables
- [ ] No sensitive data in commit history

## 📚 Full Documentation

For complete security guidelines, see: **[SECURITY.md](SECURITY.md)**

## 🆘 Need Help?

- 🔐 Security questions: Read [SECURITY.md](SECURITY.md)
- 🐛 Issues: Open a GitHub issue
- 💡 Features: Submit a pull request

---

**Remember: Security is everyone's responsibility!**