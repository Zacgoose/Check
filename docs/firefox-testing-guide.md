# Firefox Testing Guide

This guide helps you manually test the Firefox compatibility of the Check extension.

## Prerequisites

- Firefox 109 or later
- Git clone of the repository

## Setup

1. **Build for Firefox**
   ```bash
   npm run build:firefox
   ```
   This configures the extension for Firefox.

2. **Load Extension in Firefox**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..."
   - Select `manifest.json` from the repository directory
   - You should see "Check by CyberDrain" appear in the list

## Test Checklist

### ✅ Extension Loading
- [ ] Extension loads without errors
- [ ] Extension icon appears in the toolbar
- [ ] No console errors in the browser console (F12)

### ✅ Background Script
- [ ] Background script initializes (check browser console)
- [ ] No module loading errors
- [ ] Storage polyfill works (no chrome.storage.session errors)

### ✅ Popup Interface
1. Click the extension icon
2. Verify:
   - [ ] Popup opens correctly
   - [ ] Statistics display (blocked threats, scanned pages)
   - [ ] Options button works
   - [ ] Help button works
   - [ ] No JavaScript errors in console

### ✅ Options Page
1. Open extension options (right-click icon → Manage Extension → Options)
2. Verify:
   - [ ] Options page loads correctly
   - [ ] All settings are visible
   - [ ] Settings can be changed and saved
   - [ ] Custom branding section works
   - [ ] Detection rules section loads
   - [ ] No JavaScript errors in console

### ✅ Content Script Injection
1. Visit a test website (e.g., https://example.com)
2. Open browser console (F12)
3. Verify:
   - [ ] No content script errors
   - [ ] Extension badge shows status (if applicable)

### ✅ Microsoft Login Detection
1. Visit https://login.microsoftonline.com
2. Verify:
   - [ ] Extension recognizes Microsoft login page
   - [ ] Badge shows "MS" (green)
   - [ ] Valid badge displays (if enabled in settings)
   - [ ] No errors in console

### ✅ Storage Functionality

Test storage APIs:

1. **Local Storage**
   - [ ] Settings persist after closing and reopening Firefox
   - [ ] Configuration changes are saved
   
2. **Session Storage Fallback**
   - [ ] Tab verdicts work correctly
   - [ ] Session data clears on extension restart
   - Open browser console and run:
     ```javascript
     chrome.storage.session.set({test: "value"}, () => {
       chrome.storage.session.get("test", (result) => {
         console.log("Session storage test:", result);
       });
     });
     ```
   - [ ] Should log: `Session storage test: {test: "value"}`

3. **Managed Storage**
   - [ ] Extension detects managed/unmanaged environment correctly
   - Check in options page under "Enterprise Settings"

### ✅ Detection Features

1. **Phishing Detection**
   - Visit a test phishing page (if available)
   - [ ] Page is detected and blocked/warned
   - [ ] Detection is logged in statistics

2. **Allowlist**
   - Add a site to allowlist in options
   - Visit the site
   - [ ] Site is not flagged
   - [ ] Allowlist persists after reload

### ✅ Enterprise Features

If testing with policies:
- [ ] Managed policies load correctly
- [ ] Policy restrictions are enforced
- [ ] Policy UI shows correct status

### ✅ Cross-Tab Functionality
1. Open multiple tabs with different sites
2. Verify:
   - [ ] Each tab has correct badge
   - [ ] Tab-specific verdicts work
   - [ ] No conflicts between tabs

### ✅ Performance
- [ ] Extension doesn't slow down page loading noticeably
- [ ] No memory leaks after extended use
- [ ] Background script doesn't consume excessive CPU

## Common Issues

### Issue: "Temporary extension could not be loaded"
**Solution**: Ensure manifest.json is valid JSON and all required files exist.

### Issue: Module import errors
**Solution**: Verify `npm run build:firefox` was run. Firefox uses different manifest structure.

### Issue: chrome.storage.session errors
**Solution**: The polyfill should handle this. Check that browser-polyfill-inline.js is loaded in content scripts.

### Issue: Background script doesn't start
**Solution**: 
1. Check browser console for errors
2. Verify manifest.json has `"scripts": ["scripts/background.js"]` not `service_worker`
3. Ensure browser-polyfill.js exports are correct

## Comparing with Chrome

To verify feature parity:

1. **Build for Chrome**
   ```bash
   npm run build:chrome
   ```

2. Load in Chrome and test the same checklist

3. Ensure behavior is identical between browsers

## Reporting Issues

When reporting Firefox-specific issues, include:
1. Firefox version
2. Extension version
3. Console errors (browser console and background page)
4. Steps to reproduce
5. Expected vs actual behavior
6. Whether the same issue occurs in Chrome

## Debugging Tips

### View Background Script Logs
1. Go to `about:debugging#/runtime/this-firefox`
2. Find "Check by CyberDrain"
3. Click "Inspect" next to the extension
4. View console for background script logs

### View Content Script Logs
1. Open any webpage
2. Press F12 to open developer tools
3. Check console for content script logs
4. Look for messages prefixed with "[M365-Protection]"

### Check Storage Data
In the browser console, run:
```javascript
// Check local storage
chrome.storage.local.get(null, (data) => console.log("Local:", data));

// Check session storage
chrome.storage.session.get(null, (data) => console.log("Session:", data));

// Check managed storage
chrome.storage.managed.get(null, (data) => console.log("Managed:", data));
```

## Clean Testing

To test from a clean state:

1. Remove the extension
2. Clear Firefox profile data (optional, for thorough testing)
3. Reload the extension
4. Test fresh installation flow

## Success Criteria

The extension is working correctly on Firefox when:
- ✅ All test checklist items pass
- ✅ No console errors in normal operation
- ✅ Core features work identically to Chrome version
- ✅ Storage operations complete successfully
- ✅ Background script remains active
- ✅ Content scripts inject and run properly
- ✅ User settings persist across sessions

## Notes

- Firefox temporary add-ons are removed when Firefox closes
- For permanent installation, the extension needs to be signed by Mozilla
- Some Firefox-specific warnings are expected (e.g., about managed storage)
- Session storage uses local storage fallback with `__session__` prefix
