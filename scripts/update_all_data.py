#!/usr/bin/env python3
"""
Comprehensive data update script for SP500 CapEx tracker
Collects all necessary data: capex, market caps, news, filings, and statements
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def run_script(script_name, description):
    """Run a script and handle errors gracefully"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, timeout=600)
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print("Output:", result.stdout[-500:])  # Show last 500 chars
            return True
        else:
            print(f"❌ {description} failed with return code {result.returncode}")
            if result.stderr:
                print("Error:", result.stderr[-500:])
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} timed out after 10 minutes")
        return False
    except Exception as e:
        print(f"💥 {description} failed with exception: {e}")
        return False

def main():
    """Main data collection orchestrator"""
    print("🚀 Starting comprehensive data collection for SP500 CapEx tracker")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if we're in the right directory
    if not os.path.exists('fetch_data.py'):
        print("❌ Error: Not in scripts directory. Please run from /scripts folder")
        sys.exit(1)
    
    # Check environment variables
    if not os.environ.get('FMP_API_KEY'):
        print("❌ Error: FMP_API_KEY environment variable not set")
        sys.exit(1)
    
    results = {}
    
    # Step 1: Collect main CapEx data and market caps
    results['capex'] = run_script('fetch_data.py', 'Collecting CapEx data and market caps')
    
    # Step 2: Collect SEC filings data
    results['filings'] = run_script('fetch_filings_data.py', 'Collecting SEC filings data')
    
    # Step 3: Collect news data (using alternative method)
    results['news'] = run_script('fetch_news_alternative.py', 'Collecting news data')
    
    # Step 4: Collect financial statements (with rate limiting)
    print("\n" + "="*60)
    print("⚠️  Financial statements collection may take longer due to API rate limits")
    print("="*60)
    results['statements'] = run_script('fetch_statements_data.py', 'Collecting financial statements data')
    
    # Summary
    print("\n" + "="*60)
    print("📊 DATA COLLECTION SUMMARY")
    print("="*60)
    
    total_success = 0
    total_tasks = len(results)
    
    for task, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{task.upper():.<20} {status}")
        if success:
            total_success += 1
    
    print("-" * 60)
    print(f"Overall Success Rate: {total_success}/{total_tasks} ({total_success/total_tasks*100:.1f}%)")
    
    if total_success == total_tasks:
        print("🎉 All data collection completed successfully!")
        print("💡 Your SP500 CapEx tracker now has comprehensive data for all buttons!")
    else:
        print("⚠️  Some data collection failed. Check the logs above for details.")
        print("💡 The app will still work with partial data.")
    
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Exit with appropriate code
    sys.exit(0 if total_success == total_tasks else 1)

if __name__ == "__main__":
    main()