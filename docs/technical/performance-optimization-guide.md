# Performance Optimization Guide

## Background Processing for Timeouts

When phishing indicator processing times out (after 10 seconds), the extension now:

1. **Returns current results immediately** - Shows warning/block banner based on threats found so far
2. **Continues processing in background** - Remaining indicators are processed asynchronously
3. **Escalates if needed** - If critical threats are found in background, triggers a re-scan to apply block

This ensures:
- Users see protection feedback quickly (within 10s)
- All rules still get evaluated on slow pages
- Critical threats discovered late still trigger blocking

## Optimized Rules for Performance

The following rules were converted to `code_driven` with `substring_with_exclusions` logic to eliminate catastrophic backtracking:

### phi_001_enhanced (Domain Spoofing)
**Before:** 7224ms with "too much recursion" error
**After:** ~10ms with fast substring matching

**Old approach (catastrophic backtracking):**
```regex
(?!.*(?:sign\s+in\s+with\s+microsoft|continue\s+with\s+microsoft|...))
(?:secure-?(?:microsoft|office|365|outlook)|microsoft-?(?:secure|login|auth)|...)
```

**New approach (fast substring operations):**
```javascript
{
  "type": "substring_with_exclusions",
  "exclude_if_contains": [
    "sign in with microsoft",
    "continue with microsoft",
    "sso microsoft",
    "oauth microsoft"
  ],
  "match_any": [
    "secure-microsoft",
    "secure-office", 
    "microsoft-secure",
    "microsoft-login"
  ]
}
```

**How it works:**
1. Check if any exclusion phrase exists (fast substring search) - if yes, skip rule
2. Check if any match phrase exists (fast substring search) - if yes, trigger
3. No regex compilation or backtracking required

### phi_002 (Brand Impersonation)
**Before:** 5030ms with "too much recursion" error
**After:** ~10ms with fast substring matching

Uses same `substring_with_exclusions` logic but with pattern parts:
- Must have one from: ["microsoft", "office", "365"]
- AND one from: ["security", "verification", "account"]
- AND one from: ["team", "department", "support"]
- UNLESS exclusion phrases present

### phi_019_malicious_obfuscation
**Before:** 832ms regex processing
**After:** ~50ms with fast substring pre-check

Uses `substring_or_regex` logic:
- First checks for common obfuscation indicators: "atob(", "eval(", ".split('')"
- Only compiles/executes complex regex if substring found
- Avoids regex entirely on clean pages

## Performance Metrics

### Expected Improvements

| Rule | Before | After | Speedup |
|------|--------|-------|---------|
| phi_001_enhanced | 7224ms | ~10ms | 720x faster |
| phi_002 | 5030ms | ~10ms | 500x faster |
| phi_019_malicious_obfuscation | 832ms | ~50ms | 16x faster |

### Overall Impact

**Before optimization:**
- Total: 13+ seconds
- Timeout after processing 16/26 indicators
- 10 indicators never evaluated

**After optimization:**
- Total: ~2 seconds expected
- All 26 indicators evaluated
- No timeouts on most pages

## How to Monitor Performance

Check browser console for timing logs:
```
⏱️ Phishing indicator [phi_001_enhanced] processed in 10.00 ms
⏱️ Phishing indicator [phi_002] processed in 8.50 ms
⏱️ Phishing indicator [phi_019_malicious_obfuscation] processed in 45.00 ms
```

If you see timeouts:
```
⚠️ Main thread processing timeout after 10000ms, processed 20/26 indicators
🔄 Continuing to process 6 remaining indicators in background
```

This is normal behavior - the page is protected immediately, and remaining checks continue in background.

## Code-Driven Rule Types

### substring_or_regex
Fast substring pre-check before expensive regex:
```javascript
{
  "type": "substring_or_regex",
  "substrings": ["atob(", "eval(", "unescape("],
  "regex": "complex_pattern_here",
  "flags": "i"
}
```

### substring_with_exclusions
Replaces negative lookahead patterns:
```javascript
{
  "type": "substring_with_exclusions",
  "exclude_if_contains": ["legitimate phrase 1", "legitimate phrase 2"],
  "match_any": ["suspicious phrase 1", "suspicious phrase 2"]
}
```

Or with pattern parts (all parts must match):
```javascript
{
  "type": "substring_with_exclusions",
  "exclude_if_contains": ["legitimate phrase"],
  "match_pattern_parts": [
    ["word1a", "word1b"],  // One from this group
    ["word2a", "word2b"],  // AND one from this group
    ["word3a", "word3b"]   // AND one from this group
  ]
}
```

### When to Use Code-Driven

✅ **Use code-driven when:**
- Rule has negative lookahead: `(?!...)`
- Rule processes large text with wildcards: `.{0,500}`
- Rule shows up in performance logs taking >100ms
- Rule has alternation with many options: `(a|b|c|d|e|...)`

❌ **Keep regex when:**
- Pattern is simple and fast
- Need advanced regex features (backreferences, etc.)
- Pattern is rarely triggered

## Troubleshooting Performance Issues

If you see timeouts or slow processing:

1. **Check console logs** for which rules are slow
2. **Consider converting to code_driven** if:
   - Rule uses negative lookahead
   - Rule processes >100ms consistently
3. **Test the conversion** with test pages to ensure same detection
4. **Monitor after deployment** to verify improvement

## Related Files

- `scripts/content.js` - Main detection logic with code_driven support
- `scripts/modules/rules-engine-core.js` - Playground evaluation (same logic)
- `rules/detection-rules.json` - Rule definitions
- `docs/technical/code-driven-rules-analysis.md` - Original analysis
