#!/bin/bash
# Auto-save daemon for Zenith-Fresh No-BS Framework
source .gitsave

echo "Starting auto-save daemon for Zenith-Fresh..."
echo "Save interval: ${SAVE_INTERVAL} seconds"
echo "Branch prefix: ${BRANCH_PREFIX}"

while true; do
  # Check if there are changes
  if [[ $(git status --porcelain) ]]; then
    # Get current branch
    current_branch=$(git branch --show-current)
    
    # Create autosave branch if not already on one
    if [[ ! $current_branch =~ ^autosave/ ]]; then
      autosave_branch="autosave/${current_branch}-$(date +%Y%m%d-%H%M%S)"
      git checkout -b $autosave_branch
    fi
    
    # Add and commit
    git add -A
    git commit -m "${COMMIT_MESSAGE} - $(date)"
    git push -u origin $(git branch --show-current) 2>/dev/null || echo "Push failed, continuing..."
    
    echo "[$(date)] Auto-saved changes to branch: $(git branch --show-current)"
  fi
  
  sleep $SAVE_INTERVAL
done