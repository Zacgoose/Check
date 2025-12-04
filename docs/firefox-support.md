# Firefox Support for Check Extension

The Check extension now supports both Chrome and Firefox browsers through a browser API polyfill system.

## Key Differences Between Chrome and Firefox

### 1. API Namespace
- **Chrome**: Uses `chrome.*` namespace with callback-based APIs
- **Firefox**: Uses `browser.*` namespace with promise-based APIs

### 2. Background Scripts
- **Chrome**: Uses service workers (`service_worker` in manifest)
- **Firefox**: Uses background scripts (`scripts` array in manifest)

### 3. Storage API
- **Chrome**: Supports `chrome.storage.session` for tab-specific temporary storage
- **Firefox**: Does not support `session` storage in MV3 yet

### 4. Identity API
- **Chrome**: Has `identity.email` permission
- **Firefox**: Does not require separate email permission

### 5. File Protocol
- **Chrome**: Content scripts can run on `file:///*` URLs
- **Firefox**: Restricted access to file URLs

## How the Polyfill Works

The extension includes two polyfill files:

### 1. `scripts/browser-polyfill.js` (ES Module)
Used by background scripts and modules:
- Provides unified `chrome` and `storage` exports
- Automatically detects Firefox vs Chrome
- Wraps callback-based APIs with promises for Firefox
- Implements `chrome.storage.session` fallback using `local` storage with prefix

### 2. `scripts/browser-polyfill-inline.js` (Traditional Script)
Used by content scripts, popup, and options pages:
- Provides inline polyfills for non-module scripts
- Creates `chrome.storage.session` polyfill for Firefox
- Ensures `chrome.*` API is available in Firefox

## Building for Different Browsers

### Build for Chrome/Edge
```bash
npm run build:chrome
```

This uses the default `manifest.json` which includes:
- `service_worker` for background script
- `file:///*` in content script matches
- Chrome-specific permissions

### Build for Firefox
```bash
npm run build:firefox
```

This copies `manifest.firefox.json` to `manifest.json` which includes:
- `scripts` array for background script
- No `file:///*` protocol (Firefox restriction)
- `options_ui` instead of `options_page`
- `browser_specific_settings` with gecko ID
- Removed `identity.email` permission

## Testing

### Chrome/Edge
1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extension directory

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the extension directory

## Session Storage Fallback

Since Firefox doesn't support `chrome.storage.session` in MV3, the polyfill implements a fallback:
- Session data is stored in `chrome.storage.local` with `__session__` prefix
- Session data is cleared on extension startup (Firefox only)
- This provides similar behavior to Chrome's session storage

## Code Changes Required

Minimal code changes were required:

1. **Background and modules**: Import polyfill and use `storage` API
   ```javascript
   import { chrome, storage } from "./browser-polyfill.js";
   
   // Use storage.local, storage.session, storage.managed instead of chrome.storage.*
   ```

2. **Popup/Options/Content scripts**: Polyfill is auto-loaded via manifest
   - No code changes needed
   - Just use `chrome.*` API as normal
   - Polyfill handles browser differences automatically

## Files Modified for Firefox Support

- `scripts/browser-polyfill.js` - ES module polyfill
- `scripts/browser-polyfill-inline.js` - Inline polyfill for non-module scripts
- `scripts/background.js` - Import and use polyfill
- `scripts/modules/config-manager.js` - Use storage polyfill
- `scripts/modules/policy-manager.js` - Use storage polyfill
- `scripts/modules/detection-rules-manager.js` - Use storage polyfill
- `manifest.firefox.json` - Firefox-specific manifest
- `scripts/build.js` - Build script to switch manifests
- `package.json` - Added build scripts
- `popup/popup.html` - Include polyfill script
- `options/options.html` - Include polyfill script

## Important Notes

1. **Managed Storage**: Both browsers support managed storage for enterprise deployments, but the configuration method differs:
   - Chrome: Use GPO/Intune with `managed_schema.json`
   - Firefox: Use policies.json or enterprise policies

2. **WebRequest API**: Both browsers support `webRequest` in MV3, but permissions model may differ

3. **Extension ID**: Firefox requires explicit `browser_specific_settings.gecko.id` for consistent extension ID

## Future Considerations

- Monitor Firefox MV3 development for native `chrome.storage.session` support
- Test enterprise deployment mechanisms for Firefox
- Consider using WebExtension Polyfill library for even broader compatibility
