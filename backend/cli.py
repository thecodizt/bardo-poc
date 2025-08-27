#!/usr/bin/env python3
"""
CLI script for data management operations
"""
import sys
from load_data import load_stories_from_csv

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python cli.py load        # Load data (skip if already exists)")
        print("  python cli.py reload      # Force reload data (clears existing)")
        return
    
    command = sys.argv[1].lower()
    
    if command == "load":
        print("Loading data from CSV...")
        load_stories_from_csv(clear_existing=False)
        
    elif command == "reload":
        print("Reloading data (clearing existing)...")
        load_stories_from_csv(clear_existing=True)
        
    else:
        print(f"Unknown command: {command}")
        print("Available commands: load, reload")

if __name__ == "__main__":
    main()