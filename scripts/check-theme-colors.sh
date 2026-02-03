#!/bin/bash
# Check for hardcoded colors in critical theme-aware files
# These should use CSS variables or semantic color classes instead

set -e

CRITICAL_FILES=(
  "src/app/layout.tsx"
  "src/app/page.tsx"
  "src/components/cards/AgentCard.tsx"
  "src/components/cards/AgentGrid.tsx"
  "src/components/cards/TaskCard.tsx"
  "src/components/cards/GlassCard.tsx"
  "src/components/cards/MetricCard.tsx"
)

# Patterns that should be avoided in theme-aware components
# (hardcoded backgrounds and text colors that won't adapt to theme)
AVOID_PATTERNS=(
  'bg-\[#'
  'text-\[#'
  'bg-\[rgba'
  'border-\[rgba.*255.*255.*255'  # White-based borders
)

ERRORS=0

echo "🎨 Checking for hardcoded colors in theme-critical files..."
echo ""

for file in "${CRITICAL_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    FILE_ERRORS=0
    for pattern in "${AVOID_PATTERNS[@]}"; do
      MATCHES=$(grep -c "$pattern" "$file" 2>/dev/null || echo "0")
      if [[ "$MATCHES" -gt 0 ]]; then
        if [[ "$FILE_ERRORS" -eq 0 ]]; then
          echo "❌ $file"
        fi
        echo "   - Found $MATCHES instances of: $pattern"
        FILE_ERRORS=$((FILE_ERRORS + MATCHES))
      fi
    done
    if [[ "$FILE_ERRORS" -gt 0 ]]; then
      ERRORS=$((ERRORS + FILE_ERRORS))
    else
      echo "✅ $file"
    fi
  else
    echo "⚠️  $file (not found)"
  fi
done

echo ""
if [[ "$ERRORS" -gt 0 ]]; then
  echo "❌ Found $ERRORS hardcoded color instances that may break theme switching"
  echo ""
  echo "Replace with:"
  echo "  bg-[#...]           → bg-background, bg-card, bg-muted"
  echo "  text-[#...]         → text-foreground, text-muted-foreground"
  echo "  bg-[rgba(...)]      → bg-card/60, bg-accent"
  echo "  border-[rgba(...)]  → border-border"
  exit 1
else
  echo "✅ All critical files use theme-aware colors!"
  exit 0
fi
