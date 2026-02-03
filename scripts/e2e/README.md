# Agent-Driven E2E Testing

Based on Ryan Carson's approach: Agent-driven E2E that adapts to UI changes and auto-files bugs.

## Philosophy

**Traditional E2E** → Brittle CSS selectors, fails on UI changes, PR gating
**Agent-Driven E2E** → Accessibility tree snapshots, adapts to semantic changes, daily safety net

## File Structure

```
scripts/e2e/
├── daily-e2e-test.sh       # Main test runner
├── test-flows.md           # Test scenarios for the agent
├── com.missioncontrol.e2e.plist  # launchd schedule (9 AM daily)
└── README.md               # This file
```

## How It Works

1. **Setup** — Clear state, prepare browser
2. **Navigate** — Agent visits each page using accessibility tree
3. **Verify** — Check for expected elements, data, interactions
4. **Report** — On failure, auto-file GitHub Issue with screenshots

## Running Locally

```bash
# Run the E2E test
./scripts/e2e/daily-e2e-test.sh https://agent-mission-control.vercel.app
```

## Scheduling (macOS)

```bash
cp scripts/e2e/com.missioncontrol.e2e.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.missioncontrol.e2e.plist
```

## Test Flows

See `test-flows.md` for the agent's test script.

## Auto Bug Filing

On failure, creates GitHub Issue with:
- Error description
- Screenshot
- Console logs
- Steps to reproduce

## Adapting for CI

For GitHub Actions instead of launchd:
- Use Playwright's `storageState` for auth persistence
- Run on schedule: `cron: '0 9 * * *'`
