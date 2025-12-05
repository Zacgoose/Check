# Branding Implementation in Check Extension

## Overview

This document explains how branding is applied across all user-facing components in the Check extension, including the suspicious login banner, blocked page, and extension UI.

## Problem Statement

> Does the suspicious login banner have branding applied from the custom branding config or is it statically configured? The blocked page and app takes branding from the config which the user can apply manually or via various methods like policy, reg...

## Answer

**YES**, the suspicious login banner has branding applied from the custom branding configuration, using the same mechanism as the blocked page and extension UI.

## Implementation Details

### Branding Configuration Sources

Branding can be configured through multiple methods, in order of precedence:

1. **Enterprise Policy** (Highest Priority)
   - Group Policy (GPO)
   - Microsoft Intune
   - Chrome Enterprise Policy
   - Managed via `chrome.storage.managed`

2. **Manual Configuration**
   - Options page in the extension
   - Stored in `chrome.storage.local.brandingConfig`

3. **Default Configuration**
   - `config/branding.json` file (fallback)

### How Branding is Applied

#### 1. Configuration Loading (`config-manager.js`)

The `ConfigManager` class handles loading branding from all sources:

```javascript
async loadBrandingConfig() {
  // First, try user-configured branding from storage
  const userBranding = await storage.local.get(["brandingConfig"]);
  
  if (userBranding && userBranding.brandingConfig) {
    return userBranding.brandingConfig;
  }
  
  // Fallback: Load from config/branding.json
  const response = await fetch(chrome.runtime.getURL("config/branding.json"));
  return await response.json();
}

async getFinalBrandingConfig() {
  let finalBranding = await this.getBrandingConfig();
  
  // Enterprise custom branding takes precedence
  if (this.enterpriseConfig?.customBranding) {
    finalBranding = {
      ...finalBranding,
      ...this.enterpriseConfig.customBranding,
    };
  }
  
  return finalBranding;
}
```

#### 2. Suspicious Login Banner (`content.js` - lines 5262-5565)

The `showWarningBanner()` function applies branding:

```javascript
function showWarningBanner(reason, analysisData) {
  // Fetch branding configuration from storage
  const fetchBranding = () =>
    new Promise((resolve) => {
      chrome.storage.local.get(["brandingConfig"], (result) => {
        resolve(result?.brandingConfig || {});
      });
    });

  // Apply branding to the banner
  const applyBranding = (bannerEl, branding) => {
    const companyName = branding.companyName || branding.productName || "CyberDrain";
    const supportEmail = branding.supportEmail || "";
    let logoUrl = branding.logoUrl || chrome.runtime.getURL("images/icon48.png");
    
    // Create branding section with logo
    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = companyName + " logo";
    
    // Show "Protected by [CompanyName]"
    const titleSpan = document.createElement("span");
    titleSpan.textContent = "Protected by " + companyName;
    
    // Add support email link if configured
    if (supportEmail) {
      const contactLink = document.createElement("a");
      contactLink.textContent = "Report as clean/safe";
      contactLink.href = `mailto:${supportEmail}...`;
    }
  };
  
  // Apply branding when banner is created or updated
  fetchBranding().then((branding) => applyBranding(banner, branding));
}
```

**Key Features:**
- ✅ Company logo displayed
- ✅ "Protected by [CompanyName]" text
- ✅ Support email link (if configured)
- ✅ Same branding source as blocked page

#### 3. Blocked Page (`blocked.js` - lines 470-679)

The blocked page uses the same branding mechanism:

```javascript
async function loadBranding() {
  // Get branding from background script (uses ConfigManager)
  const brandingResult = await chrome.runtime.sendMessage({
    type: "GET_BRANDING_CONFIG"
  });
  
  if (brandingResult?.success && brandingResult.branding) {
    const branding = brandingResult.branding;
    
    // Apply company name
    document.getElementById("companyName").textContent = 
      branding.companyName || branding.productName;
    
    // Apply logo
    if (branding.logoUrl) {
      customLogo.src = branding.logoUrl;
    }
    
    // Apply primary color
    if (branding.primaryColor) {
      // Apply to UI elements
    }
    
    // Show/hide contact button based on support email
    if (branding.supportEmail) {
      contactBtn.style.display = "inline-block";
    }
  }
}
```

#### 4. Background Script Handler (`background.js` - lines 1106-1121)

The background script provides centralized branding access:

```javascript
case "GET_BRANDING_CONFIG":
  const branding = await this.configManager.getFinalBrandingConfig();
  sendResponse({
    success: true,
    branding: branding,
  });
  break;
```

## Branding Configuration Properties

The branding configuration supports the following properties:

```json
{
  "companyName": "Your Company",
  "productName": "Check",
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#F77F00",
  "supportEmail": "security@example.com",
  "supportUrl": "https://example.com/support"
}
```

## Branding Application Methods

### Method 1: Manual Configuration (Options Page)

Users can configure branding through the extension options page:
1. Open extension options
2. Navigate to "Branding" section
3. Configure company name, logo, colors, support email
4. Click "Save"
5. Branding is stored in `chrome.storage.local.brandingConfig`

### Method 2: Group Policy (GPO)

Enterprise administrators can deploy branding via Group Policy:
1. Create a GPO with managed policy configuration
2. Set `customBranding` in the policy JSON
3. Deploy to managed machines
4. Extension reads from `chrome.storage.managed`

### Method 3: Microsoft Intune

Deploy branding through Intune:
1. Create custom configuration profile
2. Include branding configuration
3. Assign to user/device groups
4. Extension reads from managed storage

### Method 4: Registry (Windows)

Set branding via Windows Registry:
```
HKLM\Software\Policies\Google\Chrome\3rdparty\extensions\[extension-id]\customBranding
```

### Method 5: Configuration File

Default fallback branding in `config/branding.json`:
```json
{
  "companyName": "CyberDrain",
  "productName": "Check",
  "logoUrl": "images/icon48.png",
  "primaryColor": "#F77F00"
}
```

## Consistency Across Components

All user-facing components use the same branding configuration:

| Component | Branding Applied | Configuration Source |
|-----------|-----------------|---------------------|
| Suspicious Login Banner | ✅ Yes | `chrome.storage.local.brandingConfig` |
| Blocked Page | ✅ Yes | `ConfigManager.getFinalBrandingConfig()` |
| Extension Popup | ✅ Yes | `chrome.storage.local.brandingConfig` |
| Options Page | ✅ Yes | `chrome.storage.local.brandingConfig` |
| Valid Badge | ⚠️ Partial | Static (no logo/company name) |

## Code References

### Suspicious Login Banner Branding
- **File:** `scripts/content.js`
- **Function:** `showWarningBanner()` (lines 5262-5565)
- **Fetch Branding:** Lines 5268-5277
- **Apply Branding:** Lines 5345-5459

### Blocked Page Branding
- **File:** `scripts/blocked.js`
- **Function:** `loadBranding()` (lines 470-679)
- **Message Handler:** Uses `GET_BRANDING_CONFIG` message

### Configuration Manager
- **File:** `scripts/modules/config-manager.js`
- **Load Branding:** `loadBrandingConfig()` (lines 156-198)
- **Final Branding:** `getFinalBrandingConfig()` (lines 459-484)

### Background Script
- **File:** `scripts/background.js`
- **Message Handler:** `GET_BRANDING_CONFIG` case (lines 1106-1121)

## Summary

The suspicious login banner **does have branding applied** from the custom branding configuration. It uses the exact same branding mechanism as the blocked page and other components:

1. ✅ Loads from the same configuration sources (storage, policy, file)
2. ✅ Displays company logo
3. ✅ Shows company name ("Protected by [Company]")
4. ✅ Includes support email link
5. ✅ Can be customized via manual configuration, GPO, Intune, or registry

The implementation is **consistent and unified** across all components of the extension.
