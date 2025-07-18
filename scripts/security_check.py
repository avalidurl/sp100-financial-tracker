#!/usr/bin/env python3
"""
Security verification script for sp100-capex project.
Checks for any potential API key leaks or security vulnerabilities.
"""

import os
import re
import json
import sys
from pathlib import Path

# Patterns that should never appear in code
DANGEROUS_PATTERNS = [
    r'[A-Za-z0-9]{32}',  # 32-character API keys (FMP pattern)
    r'[A-Za-z0-9]{40}',  # 40-character API keys  
    r'api_key\s*=\s*["\'][^"\']+["\']',  # Hardcoded API keys
    r'secret\s*=\s*["\'][^"\']+["\']',  # Hardcoded secrets
    r'token\s*=\s*["\'][^"\']+["\']',  # Hardcoded tokens
    r'password\s*=\s*["\'][^"\']+["\']',  # Hardcoded passwords
    r'FMP_API_KEY\s*=\s*["\'][^"\']+["\']',  # Hardcoded FMP keys
    r'os\.environ\.get\(["\']FMP_API_KEY["\'],\s*["\'][^"\']+["\']',  # Fallback API keys
]

# Patterns to ignore (known safe patterns)
SAFE_PATTERNS = [
    r'0x[0-9a-fA-F]{40}',  # Ethereum addresses (public)
    r'github\.com',  # GitHub URLs
    r'example\.com',  # Example domains
]

# Files and directories to exclude from scanning
EXCLUDE_PATTERNS = [
    '.git/',
    '__pycache__/',
    'venv/',
    '.venv/',
    'node_modules/',
    '.env',  # Our actual env file is allowed to have the key
    'scripts/security_check.py',  # This file contains patterns for detection
]

def should_exclude(file_path):
    """Check if file should be excluded from security scan."""
    for pattern in EXCLUDE_PATTERNS:
        if pattern in str(file_path):
            return True
    return False

def scan_file(file_path):
    """Scan a single file for security vulnerabilities."""
    vulnerabilities = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        for i, line in enumerate(content.split('\n'), 1):
            for pattern in DANGEROUS_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    # Skip if it's just our security check patterns
                    if 'DANGEROUS_PATTERNS' in line or 'Our actual API key' in line:
                        continue
                    
                    # Skip if it's a known safe pattern
                    is_safe = False
                    for safe_pattern in SAFE_PATTERNS:
                        if re.search(safe_pattern, line, re.IGNORECASE):
                            is_safe = True
                            break
                    if is_safe:
                        continue
                    
                    vulnerabilities.append({
                        'file': str(file_path),
                        'line': i,
                        'content': line.strip(),
                        'pattern': pattern
                    })
    except Exception as e:
        print(f"⚠️  Could not scan {file_path}: {e}")
    
    return vulnerabilities

def check_environment_setup():
    """Verify environment is properly configured."""
    issues = []
    
    # Check if .env exists
    if not os.path.exists('.env'):
        issues.append("❌ .env file not found - run: cp .env.example .env")
    
    # Check if API key is set
    api_key = os.environ.get('FMP_API_KEY')
    if not api_key:
        issues.append("❌ FMP_API_KEY environment variable not set")
    elif api_key == 'your_fmp_api_key_here':
        issues.append("❌ FMP_API_KEY still has placeholder value")
    
    # Check .gitignore
    if os.path.exists('.gitignore'):
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
        if '.env' not in gitignore_content:
            issues.append("❌ .env not properly excluded in .gitignore")
    else:
        issues.append("❌ .gitignore file missing")
    
    return issues

def check_git_tracking():
    """Check if any sensitive files are being tracked by git."""
    import subprocess
    
    try:
        # Check if .env is tracked
        result = subprocess.run(['git', 'ls-files', '.env'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            return ["🚨 CRITICAL: .env file is being tracked by git!"]
        
        # Check for any tracked files with secrets
        result = subprocess.run(['git', 'ls-files'], 
                              capture_output=True, text=True)
        tracked_files = result.stdout.split('\n')
        
        secret_files = []
        for file in tracked_files:
            if any(pattern in file.lower() for pattern in ['secret', 'key', '.env']):
                if file not in ['.env.example', '.gitignore']:
                    secret_files.append(file)
        
        if secret_files:
            return [f"⚠️  Potentially sensitive file tracked: {f}" for f in secret_files]
            
    except subprocess.CalledProcessError:
        return ["⚠️  Could not check git tracking (not a git repo?)"]
    
    return []

def main():
    """Run comprehensive security check."""
    print("🔒 SP100-CapEx Security Check")
    print("=" * 50)
    
    # Get project root
    project_root = Path.cwd()
    
    # Scan all files
    all_vulnerabilities = []
    files_scanned = 0
    
    print("📁 Scanning files for security vulnerabilities...")
    
    for file_path in project_root.rglob('*'):
        if file_path.is_file() and not should_exclude(file_path):
            vulnerabilities = scan_file(file_path)
            all_vulnerabilities.extend(vulnerabilities)
            files_scanned += 1
    
    print(f"📊 Scanned {files_scanned} files")
    
    # Check environment setup
    print("\n🔧 Checking environment configuration...")
    env_issues = check_environment_setup()
    
    # Check git tracking
    print("📋 Checking git tracking...")
    git_issues = check_git_tracking()
    
    # Report results
    print("\n" + "=" * 50)
    print("🎯 SECURITY SCAN RESULTS")
    print("=" * 50)
    
    if all_vulnerabilities:
        print("🚨 SECURITY VULNERABILITIES FOUND:")
        for vuln in all_vulnerabilities:
            print(f"❌ {vuln['file']}:{vuln['line']}")
            print(f"   Content: {vuln['content']}")
            print(f"   Pattern: {vuln['pattern']}")
            print()
        
        print("🚨 IMMEDIATE ACTION REQUIRED!")
        return 1
    else:
        print("✅ No security vulnerabilities detected in code files")
    
    if env_issues:
        print("\n⚠️  ENVIRONMENT SETUP ISSUES:")
        for issue in env_issues:
            print(f"   {issue}")
    else:
        print("✅ Environment configuration is secure")
    
    if git_issues:
        print("\n⚠️  GIT TRACKING ISSUES:")
        for issue in git_issues:
            print(f"   {issue}")
    else:
        print("✅ Git tracking is secure")
    
    if not env_issues and not git_issues and not all_vulnerabilities:
        print("\n🎉 ALL SECURITY CHECKS PASSED!")
        print("🛡️  Your project is secure and ready for deployment.")
        return 0
    else:
        print("\n⚠️  Please fix the issues above before deploying.")
        return 1

if __name__ == "__main__":
    sys.exit(main())