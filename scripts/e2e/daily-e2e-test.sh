#!/bin/bash
# Mission Control Daily E2E Test Runner
# Based on Ryan Carson's agent-driven E2E approach

set -euo pipefail

# Configuration
BASE_URL="${1:-https://agent-mission-control.vercel.app}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../../logs/e2e"
SCREENSHOT_DIR="$LOG_DIR/screenshots"
DATE=$(date '+%Y-%m-%d_%H-%M')
LOG_FILE="$LOG_DIR/e2e-$DATE.log"
TEST_STATUS="SUCCESS"
declare -a ERRORS=()

# GitHub Issue filing (requires GITHUB_TOKEN env var)
GITHUB_REPO="${GITHUB_REPO:-mattwyckhouse/agent-mission-control}"
GITHUB_API="https://api.github.com/repos/$GITHUB_REPO/issues"

# Setup
mkdir -p "$LOG_DIR" "$SCREENSHOT_DIR"

log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

add_error() {
    ERRORS+=("$1")
    TEST_STATUS="FAILED"
    log "ERROR: $1"
}

# Take screenshot via browser tool
take_screenshot() {
    local name="$1"
    local path="$SCREENSHOT_DIR/${DATE}_${name}.png"
    openclaw browser screenshot --path "$path" 2>/dev/null || true
    echo "$path"
}

# File bug on GitHub
file_bug() {
    [[ "$TEST_STATUS" == "SUCCESS" ]] && return
    [[ -z "${GITHUB_TOKEN:-}" ]] && { log "GITHUB_TOKEN not set, skipping bug filing"; return; }
    
    local title="[E2E] Daily test failed - $(date '+%Y-%m-%d %H:%M')"
    local body="## E2E Test Failure\n\n**Date:** $(date)\n**URL:** $BASE_URL\n\n### Errors:\n"
    
    for err in "${ERRORS[@]}"; do
        body+="- $err\n"
    done
    
    body+="\n### Log File:\n\`$LOG_FILE\`\n"
    body+="\n### Screenshots:\n\`$SCREENSHOT_DIR\`\n"
    
    # Check for duplicate bug in last 24 hours
    local existing=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "$GITHUB_API?state=open&labels=e2e-failure&since=$(date -v-1d '+%Y-%m-%dT%H:%M:%SZ')" \
        | grep -c '"title"' || echo "0")
    
    if [[ "$existing" -gt 0 ]]; then
        log "Similar bug exists in last 24h, skipping duplicate"
        return
    fi
    
    curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"title\": \"$title\", \"body\": \"$(echo -e "$body")\", \"labels\": [\"bug\", \"e2e-failure\"]}" \
        "$GITHUB_API" > /dev/null
    
    log "Bug filed: $title"
}

# Retry wrapper for flaky operations
run_with_retry() {
    local max_attempts=2
    for ((i=1; i<=max_attempts; i++)); do
        if "$@"; then return 0; fi
        log "Attempt $i failed, retrying..."
        sleep 3
    done
    return 1
}

# ============================================
# TEST FUNCTIONS
# ============================================

test_dashboard() {
    log "Testing: Dashboard Page"
    openclaw browser navigate --url "$BASE_URL" || { add_error "Dashboard failed to load"; return 1; }
    sleep 2
    
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    # Check for key elements
    if ! echo "$snapshot" | grep -qi "squad status\|total agents"; then
        add_error "Dashboard missing key elements (Squad Status, metrics)"
        take_screenshot "dashboard_failure"
        return 1
    fi
    
    # Check for agent grid
    if ! echo "$snapshot" | grep -qi "agent\|klaus\|iris\|forge"; then
        add_error "Dashboard missing agent grid"
        take_screenshot "dashboard_no_agents"
        return 1
    fi
    
    log "✓ Dashboard page OK"
    take_screenshot "dashboard_success"
}

test_agent_detail() {
    log "Testing: Agent Detail Page"
    openclaw browser navigate --url "$BASE_URL/agent/klaus" || { add_error "Agent detail failed to load"; return 1; }
    sleep 2
    
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    if ! echo "$snapshot" | grep -qi "klaus\|squad lead"; then
        add_error "Agent detail page missing agent info"
        take_screenshot "agent_detail_failure"
        return 1
    fi
    
    log "✓ Agent detail page OK"
    take_screenshot "agent_detail_success"
}

test_tasks() {
    log "Testing: Tasks Page"
    openclaw browser navigate --url "$BASE_URL/tasks" || { add_error "Tasks page failed to load"; return 1; }
    sleep 2
    
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    if ! echo "$snapshot" | grep -qi "task\|kanban\|urgent\|action"; then
        add_error "Tasks page missing kanban board"
        take_screenshot "tasks_failure"
        return 1
    fi
    
    log "✓ Tasks page OK"
    take_screenshot "tasks_success"
}

test_ralph_monitor() {
    log "Testing: Ralph Monitor Page"
    openclaw browser navigate --url "$BASE_URL/ralph" || { add_error "Ralph page failed to load"; return 1; }
    sleep 2
    
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    if ! echo "$snapshot" | grep -qi "ralph\|build\|loop"; then
        add_error "Ralph monitor page missing build info"
        take_screenshot "ralph_failure"
        return 1
    fi
    
    # Check for stale data indicator
    if echo "$snapshot" | grep -qi "17/48\|step 17"; then
        add_error "Ralph showing stale mock data (17/48 instead of real progress)"
        take_screenshot "ralph_stale_data"
    fi
    
    log "✓ Ralph monitor page OK"
    take_screenshot "ralph_success"
}

test_costs() {
    log "Testing: Costs Page"
    openclaw browser navigate --url "$BASE_URL/costs" || { add_error "Costs page failed to load"; return 1; }
    sleep 2
    
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    if ! echo "$snapshot" | grep -qi "cost\|\$"; then
        add_error "Costs page missing cost data"
        take_screenshot "costs_failure"
        return 1
    fi
    
    log "✓ Costs page OK"
    take_screenshot "costs_success"
}

test_navigation() {
    log "Testing: Navigation"
    openclaw browser navigate --url "$BASE_URL" || return 1
    sleep 1
    
    # Try clicking nav links
    local snapshot=$(openclaw browser snapshot 2>/dev/null || echo "")
    
    if ! echo "$snapshot" | grep -qi "nav\|menu\|dashboard\|tasks"; then
        add_error "Navigation missing"
        take_screenshot "nav_failure"
        return 1
    fi
    
    log "✓ Navigation OK"
}

# ============================================
# MAIN
# ============================================

log "======================================"
log "Mission Control E2E Test - $DATE"
log "URL: $BASE_URL"
log "======================================"

# Start browser
log "Starting browser..."
openclaw browser start --profile openclaw 2>/dev/null || true
sleep 2

# Run tests
run_with_retry test_dashboard || true
run_with_retry test_tasks || true
run_with_retry test_ralph_monitor || true
run_with_retry test_costs || true
run_with_retry test_agent_detail || true
run_with_retry test_navigation || true

# Cleanup
log "Closing browser..."
openclaw browser stop 2>/dev/null || true

# Summary
log "======================================"
if [[ "$TEST_STATUS" == "SUCCESS" ]]; then
    log "✅ ALL TESTS PASSED"
else
    log "❌ TESTS FAILED (${#ERRORS[@]} errors)"
    for err in "${ERRORS[@]}"; do
        log "  - $err"
    done
    file_bug
fi
log "======================================"

# Cleanup old logs (keep 7 days)
find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
find "$SCREENSHOT_DIR" -name "*.png" -mtime +7 -delete 2>/dev/null || true

exit $([[ "$TEST_STATUS" == "SUCCESS" ]] && echo 0 || echo 1)
