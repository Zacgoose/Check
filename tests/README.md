# Code-Driven Rules Tests

This directory contains test files for validating the code-driven rules functionality.

## Test Files

### code-driven-rules.test.html

An interactive HTML test suite that validates all `code_logic` types used in the detection rules.

**How to run:**
1. Open the file in a browser: `file:///path/to/Check/tests/code-driven-rules.test.html`
2. The tests run automatically on page load
3. View the results showing pass/fail status for each test case

**Test Coverage:**
- `substring_not_allowlist`: Validates substring presence with allowlist exclusion
- `substring_or_regex`: Validates fast substring search with regex fallback
- `substring`: Validates existing substring matching
- `substring_not`: Validates existing substring with exclusion matching
- Edge cases: case insensitivity, allowlist matching, regex fallback behavior

**Expected Result:**
All 9 tests should pass (100% pass rate) with a green summary section.

## Adding New Tests

To add new test cases to `code-driven-rules.test.html`:

1. Add a new test object to the `tests` array:
```javascript
{
  name: "Description of what the test validates",
  indicator: {
    code_driven: true,
    code_logic: {
      type: "substring_or_regex",  // or other type
      // ... type-specific config
    }
  },
  pageSource: '<html>test content</html>',
  expected: true  // or false
}
```

2. Refresh the page to run the new test

## Related Documentation

- [Code-Driven Rules Analysis](../docs/technical/code-driven-rules-analysis.md) - Comprehensive documentation on the code-driven rules feature
- [Detection Rules](../rules/detection-rules.json) - The actual detection rules configuration
