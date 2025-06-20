#!/bin/bash

# Zenith-Fresh Automated Deployment Script
# This script bridges the gap between Claude Code generation and GitHub deployment

set -e  # Exit on any error

echo "🚀 Zenith-Fresh Automated Deployment"
echo "======================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    echo "   Please run this script from your project root directory"
    exit 1
fi

# Check for unstaged changes
if ! git diff --quiet --exit-code; then
    echo "📝 Unstaged changes detected"
    
    # Show what changes will be committed
    echo "📋 Changes to be committed:"
    git status --short
    echo ""
    
    # Add all changes
    echo "📦 Adding changes to staging area..."
    git add .
    
    # Check if there are staged changes
    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit"
        exit 0
    fi
    
    # Generate commit message with timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MSG="feat: Claude Code automated deployment - ${TIMESTAMP}

🤖 Generated with Claude Code
- Automated commit and deployment pipeline
- All production fixes applied
- Ready for deployment

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "${COMMIT_MSG}"
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "📤 Pushing to branch: ${CURRENT_BRANCH}"
    
    # Attempt to push
    if git push origin "${CURRENT_BRANCH}"; then
        echo ""
        echo "✅ Successfully deployed to GitHub!"
        echo "🌐 Vercel deployment should trigger automatically"
        echo "📊 Check your Vercel dashboard for deployment status"
        echo ""
        echo "🔗 Repository: https://github.com/CleanExpo/Zenith-Fresh"
        echo "🔗 Deployment: https://zenith.engineer"
    else
        echo ""
        echo "❌ Failed to push to GitHub"
        echo "🔧 Possible solutions:"
        echo "   1. Check your GitHub authentication (git config --list)"
        echo "   2. Ensure you have push permissions to the repository"
        echo "   3. Set up a Personal Access Token if using HTTPS"
        echo "   4. Try: git push --set-upstream origin ${CURRENT_BRANCH}"
        exit 1
    fi
    
else
    echo "ℹ️  No unstaged changes detected"
    
    # Check if there are unpushed commits
    if [ $(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0") -gt 0 ]; then
        echo "📤 Found unpushed commits, pushing to GitHub..."
        CURRENT_BRANCH=$(git branch --show-current)
        
        if git push origin "${CURRENT_BRANCH}"; then
            echo "✅ Successfully pushed existing commits!"
        else
            echo "❌ Failed to push existing commits"
            exit 1
        fi
    else
        echo "ℹ️  Repository is up to date"
    fi
fi

echo ""
echo "🎉 Deployment process complete!"
echo "⏰ Vercel typically takes 1-3 minutes to build and deploy"