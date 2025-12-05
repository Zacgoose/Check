# Custom Branding Guide

## Overview

This guide explains how to customize the branding for the Check extension. All user-facing components (suspicious login banner, blocked page, extension popup, and options page) use the same branding configuration.

## Branding Properties

You can customize the following properties:

- **Company Name** - Your organization's name
- **Product Name** - Custom name for the extension
- **Logo URL** - Path or URL to your company logo
- **Primary Color** - Brand color for UI elements (hex format, e.g., `#FF5733`)
- **Support Email** - Contact email for user support

## How to Configure Branding

### Method 1: Manual Configuration (Options Page)

**Works with:** Chrome, Edge, Firefox

1. Open the extension's Options page
2. Navigate to the "Branding" section
3. Fill in your branding information:
   - Company Name
   - Logo (upload or provide URL)
   - Primary Color
   - Support Email
4. Click "Save"

Your branding will be immediately applied to all components.

### Method 2: Group Policy (GPO) - Chrome & Edge

For enterprise deployments using Windows Group Policy:

1. Create a new GPO or edit an existing one
2. Navigate to: `Computer Configuration > Administrative Templates > Google Chrome > Extensions`
3. Add a policy for the Check extension with the following structure:

```json
{
  "customBranding": {
    "companyName": "Your Company",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "supportEmail": "security@example.com"
  }
}
```

4. Apply the policy to target computers
5. The extension will automatically use the enterprise branding on managed devices

### Method 3: Firefox Policies (policies.json)

**Works with:** Firefox only

For Firefox deployments, configure branding through the `policies.json` file:

1. Locate or create the policies file:
   - **Windows:** `%ProgramFiles%\Mozilla Firefox\distribution\policies.json`
   - **macOS:** `/Applications/Firefox.app/Contents/Resources/distribution/policies.json`
   - **Linux:** `/etc/firefox/policies/policies.json`

2. Add the branding configuration under `3rdparty.Extensions`:

```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "check@cyberdrain.com": {
          "customBranding": {
            "companyName": "Your Company",
            "companyURL": "https://yourcompany.com",
            "productName": "Security Extension",
            "supportEmail": "security@example.com",
            "primaryColor": "#FF5733",
            "logoUrl": "https://example.com/logo.png"
          }
        }
      }
    }
  }
}
```

3. Save the file and restart Firefox

**Note:** The Firefox extension ID is `check@cyberdrain.com`

### Method 4: Microsoft Intune - Chrome & Edge

For organizations using Microsoft Intune with Chrome/Edge:

1. Create a new Configuration Profile
2. Select "Custom" configuration
3. Add the branding configuration as a JSON payload:

```json
{
  "customBranding": {
    "companyName": "Your Company",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "supportEmail": "security@example.com"
  }
}
```

4. Assign the profile to user or device groups
5. Branding will be applied on enrolled devices

### Method 5: Chrome Enterprise Policy

For Chrome Enterprise customers:

1. Access the Google Admin Console
2. Navigate to: `Devices > Chrome > Apps & Extensions`
3. Select the Check extension
4. Add the branding configuration under "Policy for extensions"
5. Save and publish the policy

### Method 6: Windows Registry (Advanced) - Chrome & Edge

For direct registry configuration with Chrome/Edge:

1. Open Registry Editor
2. Navigate to: `HKLM\Software\Policies\Google\Chrome\3rdparty\extensions\[extension-id]`
3. Create a new key named `customBranding`
4. Add string values for each branding property
5. Restart the browser

## Configuration Priority

When multiple configuration methods are used, they are applied in this order (highest to lowest priority):

1. **Enterprise Policy** (GPO/Intune/Chrome Enterprise/Firefox Policies)
2. **Manual Configuration** (Options page)
3. **Default Configuration** (Built-in defaults)

Enterprise policies always take precedence over manual settings.

## Browser-Specific Notes

### Firefox
- Uses extension ID: `check@cyberdrain.com`
- Configuration is managed through `policies.json` file
- Supports additional `companyURL` property
- Policies file location varies by operating system

### Chrome & Edge
- Configuration through GPO, Intune, or Chrome Enterprise Policy
- Uses Windows Registry for advanced configurations
- Supports standard Chrome extension policy format

## Where Branding Appears

Your custom branding will be displayed on:

- **Suspicious Login Banner** - Warning banner shown on potentially malicious sites
- **Blocked Page** - Full-page block screen for confirmed threats
- **Extension Popup** - Extension icon popup
- **Options Page** - Extension settings page

All components show your logo, company name, and use your brand colors consistently.

## Branding Properties Reference

### companyName
- **Type:** String
- **Default:** "CyberDrain"
- **Example:** "Contoso Corporation"
- **Where used:** Displayed as "Protected by [Company Name]"
- **Browsers:** All (Chrome, Edge, Firefox)

### companyURL
- **Type:** String (URL)
- **Default:** None
- **Example:** "https://yourcompany.com"
- **Where used:** Company website links
- **Browsers:** Firefox (optional in Chrome/Edge)

### productName
- **Type:** String
- **Default:** "Check"
- **Example:** "Contoso Security Guard"
- **Where used:** Extension name in UI elements
- **Browsers:** All (Chrome, Edge, Firefox)

### logoUrl
- **Type:** String (URL or local path)
- **Default:** Built-in Check logo
- **Example:** "https://cdn.example.com/logo.png" or "images/custom-logo.png"
- **Where used:** Displayed on banners, blocked page, popup
- **Browsers:** All (Chrome, Edge, Firefox)

### primaryColor
- **Type:** String (hex color)
- **Default:** "#F77F00"
- **Example:** "#0066CC"
- **Where used:** Buttons, headings, accent elements
- **Browsers:** All (Chrome, Edge, Firefox)

### supportEmail
- **Type:** String (email address)
- **Default:** None
- **Example:** "security@example.com"
- **Where used:** Contact links on blocked pages and warning banners
- **Browsers:** All (Chrome, Edge, Firefox)

## Example Configurations

### Basic Branding (Chrome/Edge)
```json
{
  "customBranding": {
    "companyName": "Acme Corp",
    "primaryColor": "#00AA00"
  }
}
```

### Full Branding (Chrome/Edge)
```json
{
  "customBranding": {
    "companyName": "Contoso Corporation",
    "productName": "Contoso Defender",
    "logoUrl": "https://contoso.com/assets/logo.png",
    "primaryColor": "#0078D4",
    "supportEmail": "security@contoso.com"
  }
}
```

### Firefox Policy Example
```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "check@cyberdrain.com": {
          "customBranding": {
            "companyName": "Contoso Corporation",
            "companyURL": "https://contoso.com",
            "productName": "Contoso Defender",
            "logoUrl": "https://contoso.com/assets/logo.png",
            "primaryColor": "#0078D4",
            "supportEmail": "security@contoso.com"
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### Branding Not Appearing
- Verify the configuration is saved correctly
- Check browser console for errors
- Ensure logo URLs are accessible
- Restart the browser after configuration changes

### Logo Not Displaying
- Verify the logo URL is publicly accessible (if using external URL)
- Check image format (PNG, JPG, SVG supported)
- Ensure image size is reasonable (recommended: 200x200px or smaller)

### Enterprise Policy Not Working
- Verify the policy is applied to the correct organizational unit
- Check that the extension ID matches your deployment
- Allow 15-30 minutes for policy propagation
- Run `gpupdate /force` on Windows to force policy refresh

## Additional Resources

### Firefox-Specific Documentation
- [Firefox Support Guide](firefox-support.md)
- [Firefox Deployment Guide](deployment/firefox-deployment.md)
- Template: `enterprise/firefox/policies.json`

### Chrome/Edge Documentation
- [Chrome/Edge Deployment](deployment/chrome-edge-deployment-instructions/README.md)
- Schema: `config/managed_schema.json`

## Support

For additional help with branding configuration, contact your IT administrator or refer to your organization's deployment documentation.
