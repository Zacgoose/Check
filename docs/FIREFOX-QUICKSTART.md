# Quick Start: Firefox Support

## TL;DR

The Check extension now works on Firefox! Here's how to test it:

### For Chrome/Edge (Default)
```bash
npm run build:chrome
```
Then load unpacked in `chrome://extensions`

### For Firefox
```bash
npm run build:firefox
```
Then load temporary add-on at `about:debugging#/runtime/this-firefox`

## What Changed?

- ✅ Browser polyfills handle API differences automatically
- ✅ Session storage fallback for Firefox (using local storage)
- ✅ Dual manifest system with easy switching
- ✅ All features work identically in both browsers

## Documentation

- **[Firefox Support Guide](firefox-support.md)** - Complete technical details
- **[Firefox Testing Guide](firefox-testing-guide.md)** - Manual testing checklist
- **[Implementation Summary](firefox-implementation-summary.md)** - What was changed and why

## Testing

1. Run `npm run build:firefox`
2. Open Firefox 109+
3. Navigate to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select `manifest.json` from the repository
6. Follow the testing guide to verify functionality

## Important Notes

- **Default state**: Repository is configured for Chrome by default
- **Build scripts**: Must run `npm run build:firefox` before testing in Firefox
- **Manifest backup**: Build script creates `manifest.chrome.json` backup
- **No conflicts**: Can switch between browsers without losing data
- **Session storage**: Uses local storage fallback in Firefox (transparent to user)

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✓ Fully Supported |
| Edge | 88+ | ✓ Fully Supported |
| Firefox | 109+ | ✓ Fully Supported (New!) |

## Need Help?

- Check `firefox-testing-guide.md` for detailed testing steps
- See `firefox-support.md` for technical implementation details
- Review `firefox-implementation-summary.md` for complete changelog

## Quick Reference

```bash
# Switch to Firefox
npm run build:firefox

# Switch back to Chrome
npm run build:chrome

# Check current browser configuration
grep -A 2 '"background"' manifest.json
# service_worker = Chrome
# scripts = Firefox
```
