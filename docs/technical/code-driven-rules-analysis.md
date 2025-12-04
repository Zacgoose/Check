# Code-Driven Rules Analysis

## Executive Summary

The `code_driven` option in the detection rules is **currently non-functional** due to a mismatch between the configuration and implementation. This document explains the issue, its impact, and the solution.

## Background

The `code_driven` option was intended to provide an alternative to regex-based pattern matching, potentially offering:
- Better performance through optimized string operations
- More explicit and maintainable detection logic
- Flexibility to implement complex detection scenarios

## Current State

### Rules Configuration

Two rules in `rules/detection-rules.json` have `code_driven: true`:

#### 1. phi_012_suspicious_resources (Line 487)
```json
{
  "id": "phi_012_suspicious_resources",
  "code_driven": true,
  "code_logic": {
    "type": "substring_not_allowlist",
    "substring": "customcss",
    "allowlist": ["aadcdn.msftauthimages.net"]
  },
  "pattern": "customcss(?![^]*aadcdn\\.msftauthimages\\.net)",
  "flags": "i"
}
```

#### 2. phi_003 (Line 644)
```json
{
  "id": "phi_003",
  "code_driven": true,
  "code_logic": {
    "type": "substring_or_regex",
    "substrings": ["verify account", "suspended 365", ...],
    "regex": "(verify.{0,50}account|suspended.{0,50}365|...)"
  },
  "pattern": "(verify.{0,50}account|suspended.{0,50}365|...)",
  "flags": "i"
}
```

### Implementation in content.js

The implementation (lines 2118-2144) only supports **three** code_logic types:
1. `substring` - All substrings must be present
2. `substring_not` - Substrings must be present AND not_substrings must be absent
3. `allowlist` - Skip if allowlisted, otherwise use optimized_pattern

### The Problem

The code_logic types used in the rules (`substring_not_allowlist` and `substring_or_regex`) are **NOT implemented**. This means:

1. When processing these rules, the condition `if (indicator.code_driven === true && indicator.code_logic)` evaluates to true
2. However, the nested type checks fail to match any implemented type
3. The code falls through without setting `matches = true`
4. The execution continues to the `else` block (line 2145), which processes the rule using the standard regex `pattern` field

## Impact Analysis

### No Performance Benefit
Since the code_driven logic isn't actually executed, these rules perform **exactly the same** as standard regex rules. The substring operations that might be faster never run.

### Code Duplication
The rules contain both:
- `code_logic` configuration (unused)
- `pattern` regex (actually used)

This is redundant and confusing for maintainers.

### Misleading Configuration
The presence of `code_driven: true` suggests the rule operates differently, but it doesn't. This creates false expectations.

### No Functional Difference
Currently, removing the `code_driven` flag and `code_logic` from both rules would have **zero** impact on functionality.

## Solution Options

### Option 1: Implement Missing Types (Recommended)

Implement the two missing code_logic types to make the feature functional:

**substring_not_allowlist:**
```javascript
} else if (indicator.code_logic.type === "substring_not_allowlist") {
  const substring = indicator.code_logic.substring;
  const allowlist = indicator.code_logic.allowlist || [];
  
  if (pageSource.includes(substring)) {
    // Substring found, now check if it's from an allowed source
    const lowerSource = pageSource.toLowerCase();
    const isAllowed = allowlist.some(allowed => 
      lowerSource.includes(allowed.toLowerCase())
    );
    
    if (!isAllowed) {
      matches = true;
      matchDetails = "page source (substring not in allowlist)";
    }
  }
}
```

**substring_or_regex:**
```javascript
} else if (indicator.code_logic.type === "substring_or_regex") {
  const substrings = indicator.code_logic.substrings || [];
  
  // Try fast substring search first
  for (const sub of substrings) {
    if (pageSource.toLowerCase().includes(sub.toLowerCase())) {
      matches = true;
      matchDetails = "page source (substring match)";
      break;
    }
  }
  
  // Fall back to regex if no substring match
  if (!matches && indicator.code_logic.regex) {
    const pattern = new RegExp(indicator.code_logic.regex, indicator.code_logic.flags || "i");
    if (pattern.test(pageSource)) {
      matches = true;
      matchDetails = "page source (regex match)";
    }
  }
}
```

**Benefits:**
- Makes the feature functional as originally intended
- Provides actual performance benefits (substring search is faster than regex)
- Maintains backward compatibility
- Adds value to the codebase

**Performance Impact:**
- `substring_or_regex`: Can avoid regex compilation/execution when simple substring matches suffice
- `substring_not_allowlist`: More efficient than complex negative lookahead regex patterns

### Option 2: Remove Code-Driven Feature

Remove `code_driven` and `code_logic` from both rules and rely solely on regex patterns.

**Benefits:**
- Simplifies codebase
- Removes unused code
- Makes configuration clearer

**Drawbacks:**
- Loses potential performance optimization
- Removes flexibility for future enhancements

### Option 3: Update Rules to Use Implemented Types

Modify the rules to use the already-implemented code_logic types.

**Drawbacks:**
- The implemented types don't match the current requirements
- Would require different detection logic that may not be equivalent

## Recommendation

**Implement Option 1** - Add the missing code_logic types.

This approach:
1. Makes the feature actually work
2. Provides real performance benefits
3. Maintains the original design intent
4. Adds minimal code complexity
5. Makes the rules more maintainable

## Implementation Plan

1. Add `substring_not_allowlist` type handler in content.js
2. Add `substring_or_regex` type handler in content.js
3. Add similar implementations in rules-engine-core.js for playground consistency
4. Add test cases validating both code paths
5. Verify performance improvements with benchmarks
6. Update documentation

## Testing Strategy

1. Create test pages that trigger both code_driven rules
2. Verify they detect correctly
3. Verify they perform better than pure regex equivalents
4. Test edge cases (allowlist matches, substring vs regex paths)
5. Ensure playground evaluation works identically

## Related Files

- `scripts/content.js` - Main detection logic (lines 2118-2144)
- `scripts/modules/rules-engine-core.js` - Playground detection logic
- `rules/detection-rules.json` - Rule definitions
- `options/options.js` - Statistics display (line 1533)
