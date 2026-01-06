# PowerShell Deployment Fix - Verification Guide

## Issue Summary
Previously, when deploying Check via PowerShell with CIPP Server or generic webhook settings, the configuration would not work properly. The extension would still block malicious sites, but webhook/reporting functionality would fail.

## Root Cause
The configuration merge logic used shallow object merging, which would replace entire nested objects (like `genericWebhook`) instead of properly merging their properties. This caused loss of nested configuration like the `events` array.

## Solution
Implemented deep merge functionality with:
1. Proper nested object handling
2. Prototype pollution protection
3. Support for partial configuration overrides

## How to Verify the Fix

### Prerequisites
- Windows machine with administrative privileges
- Chrome or Edge browser installed
- PowerShell execution policy allowing script execution

### Test Case 1: CIPP Server Configuration

1. Edit `enterprise/Deploy-Windows-Chrome-and-Edge.ps1`
2. Set the following variables:
   ```powershell
   $enableCippReporting = 1
   $cippServerUrl = "https://your-cipp-server.example.com"
   $cippTenantId = "your-tenant-id"
   ```
3. Run the PowerShell script as administrator
4. Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
5. Find the Check extension and click on "Details"
6. Verify the extension is installed and enabled
7. Navigate to a test phishing page or trigger a detection
8. Check that the webhook is sent to the CIPP server

**Expected Result:** Detection events should be sent to the CIPP server with all configured parameters properly set.

### Test Case 2: Generic Webhook Configuration

1. Edit `enterprise/Deploy-Windows-Chrome-and-Edge.ps1`
2. Set the following variables:
   ```powershell
   $enableGenericWebhook = 1
   $webhookUrl = "https://your-webhook.example.com/endpoint"
   $webhookEvents = @("detection_alert", "page_blocked", "threat_detected")
   ```
3. Run the PowerShell script as administrator
4. Open Chrome/Edge extension options page
5. Navigate to the Webhooks section
6. Verify that:
   - Generic webhook is enabled
   - Webhook URL is set correctly
   - All three event types are selected

**Expected Result:** The generic webhook configuration should be properly saved and all event types should be preserved.

### Test Case 3: Combined CIPP and Webhook Configuration

1. Edit `enterprise/Deploy-Windows-Chrome-and-Edge.ps1`
2. Set both CIPP and generic webhook variables:
   ```powershell
   $enableCippReporting = 1
   $cippServerUrl = "https://cipp.example.com"
   $cippTenantId = "tenant-123"
   
   $enableGenericWebhook = 1
   $webhookUrl = "https://webhook.example.com/endpoint"
   $webhookEvents = @("detection_alert", "page_blocked")
   ```
3. Run the PowerShell script as administrator
4. Trigger a detection event
5. Verify that events are sent to **both** endpoints

**Expected Result:** Both CIPP and generic webhook should receive detection events.

### Verification via Registry

After deployment, you can verify the configuration in the Windows Registry:

For Chrome:
```
HKLM:\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\benimdeioplgkhanklclahllklceahbe\policy
```

For Edge:
```
HKLM:\SOFTWARE\Policies\Microsoft\Edge\3rdparty\extensions\knepjpocdagponkonnbggpcnhnaikajg\policy
```

Check that:
1. `genericWebhook` key exists
2. `genericWebhook\enabled` is set to 1 (if enabled)
3. `genericWebhook\url` contains the webhook URL
4. `genericWebhook\events` subkey contains numbered entries (1, 2, 3, etc.) with event names

### Testing with Mock Webhook

You can use a webhook testing service like webhook.site to verify the webhook functionality:

1. Go to https://webhook.site
2. Copy the unique URL provided
3. Use that URL in the `$webhookUrl` variable
4. Deploy via PowerShell
5. Trigger a detection event
6. Check webhook.site to see the incoming webhook payload

## Technical Details

### Deep Merge Implementation

The fix implements a proper deep merge function that:
- Recursively merges nested objects
- Preserves arrays and primitive values from the source
- Handles null/undefined values gracefully
- Protects against prototype pollution attacks

### Prototype Pollution Protection

The implementation includes security measures to prevent prototype pollution:
- Checks `hasOwnProperty` before copying properties
- Blocks dangerous keys: `__proto__`, `constructor`, `prototype`
- Only processes own enumerable properties

### Configuration Precedence

Configuration is merged in the following order (highest precedence last):
1. Default configuration
2. Branding configuration
3. Local user configuration
4. Enterprise/managed configuration

## Troubleshooting

### Issue: Webhook events still not being sent

**Check:**
1. Verify the extension is installed and enabled
2. Check browser console for any errors
3. Verify the webhook URL is accessible from the browser
4. Check that events are properly configured in registry
5. Enable debug logging to see webhook send attempts

### Issue: Configuration not persisting

**Check:**
1. Verify PowerShell script ran with administrator privileges
2. Check Windows Event Log for policy application errors
3. Verify registry keys were created correctly
4. Restart browser after policy deployment

### Issue: Partial configuration missing

**Check:**
1. Verify all required variables are set in PowerShell script
2. Check for typos in variable names
3. Verify arrays are properly formatted with @() syntax
4. Run `Test-Extension-Policy.ps1` to validate configuration

## Related Files

- `scripts/modules/config-manager.js` - Configuration management with deep merge
- `scripts/modules/webhook-manager.js` - Webhook sending logic
- `enterprise/Deploy-Windows-Chrome-and-Edge.ps1` - PowerShell deployment script
- `config/managed_schema.json` - Configuration schema definition
- `tests/config-persistence.test.js` - Configuration tests

## Additional Resources

- [PowerShell Deployment Documentation](../docs/deployment/chrome-edge-deployment-instructions/windows/manual-deployment.md)
- [Configuration Schema](../config/managed_schema.json)
- [Webhook Documentation](../docs/webhooks.md)
