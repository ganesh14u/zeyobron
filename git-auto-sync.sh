#!/bin/bash

# Configuration
REPO_DIR="/Users/saiganesh/GitProjects/zeyobron"
INTERVAL=1200 # 20 minutes
STABILITY_WAIT=120 # 2 minutes of inactivity to consider work "complete"

cd "$REPO_DIR" || exit

echo "🚀 Git Auto-Sync started."
echo "Interval: $((INTERVAL / 60)) mins | Stability Wait: $((STABILITY_WAIT / 60)) mins"

while true; do
    # Check for any changes (including untracked files)
    if [[ -n $(git status --short) ]]; then
        echo "[$(date '+%H:%M:%S')] Changes detected. Monitoring for stability..."
        
        # Wait for the user or AI to finish writing
        while true; do
            # Get latest modification timestamp across all files (excluding .git and node_modules)
            LATEST_MOD=$(find . -type f -not -path "*/.git/*" -not -path "*/node_modules/*" -exec stat -f "%m" {} + | sort -rn | head -1)
            NOW=$(date +%s)
            ELAPSED=$((NOW - LATEST_MOD))
            
            if [[ "$ELAPSED" -ge "$STABILITY_WAIT" ]]; then
                echo "[$(date '+%H:%M:%S')] Files stable for $ELAPSED seconds. Preparing commit..."
                break
            else
                echo "[$(date '+%H:%M:%S')] Active changes detected ($ELAPSED seconds ago). Waiting..."
                sleep 30
            fi
        done
        
        # Stage all changes
        git add .
        
        # Determine a "Proper" commit message based on changed files
        FILES_CHANGED=$(git diff --cached --name-only)
        COUNT=$(echo "$FILES_CHANGED" | wc -l | xargs)
        
        if [ "$COUNT" -eq 1 ]; then
            COMMIT_MSG="fix/feat: update $FILES_CHANGED"
        elif [ "$COUNT" -le 3 ]; then
            # Concatenate up to 3 filenames
            SUMMARY=$(echo "$FILES_CHANGED" | tr '\n' ',' | sed 's/,$//')
            COMMIT_MSG="chore: update $SUMMARY"
        else
            COMMIT_MSG="chore: bulk update $COUNT files at $(date '+%Y-%m-%d %H:%M')"
        fi
        
        # Commit and Push
        git commit -m "$COMMIT_MSG"
        if git push origin main; then
            echo "[$(date '+%H:%M:%S')] ✅ Successfully pushed $COUNT changes to GitHub."
        else
            echo "[$(date '+%H:%M:%S')] ❌ Push failed. Will retry in next cycle."
        fi
    else
        echo "[$(date '+%H:%M:%S')] No changes detected."
    fi
    
    echo "Next check in $((INTERVAL / 60)) minutes..."
    sleep "$INTERVAL"
done
