# Quick Start: Using PWA Features

## 🎯 Quick Setup Steps

### 1. Using the Install Button (Easiest)
Add this to any page where you want users to install the app:

```tsx
import { PWAInstallButton } from '@/components/PWAInstallButton';

export default function YourPage() {
  return (
    <div>
      <PWAInstallButton />
      {/* rest of your content */}
    </div>
  );
}
```

### 2. Custom Install Logic
If you want more control:

```tsx
import { setupPWAInstallPrompt, triggerPWAInstall } from '@/lib/pwa-install';

useEffect(() => {
  setupPWAInstallPrompt();
}, []);

const handleCustomInstall = async () => {
  const success = await triggerPWAInstall();
  if (success) {
    console.log('App installed successfully!');
  }
};
```

## 🎨 Logo Information

**Department of Health - South Africa**
- Logo Color: Healthcare Green (#1e7e34)
- Accent: Professional Gold (#ffa500)
- Design: Modern health cross with gradient
- Available Sizes: 72px, 96px, 128px, 144px, 152px, 192px, 384px, 512px

## 📱 Installation URLs

Users can visit these URLs and install the PWA:
- **Production**: https://your-domain.com
- **Local Testing**: http://localhost:3000

## 🔍 How to Test Installation

1. Open the app in Chrome/Edge
2. Click "Install app" button (address bar)
3. Or right-click → "Install app"
4. Verify the Department of Health logo appears

## 📊 What Users See

When installed, users get:
- ✅ App icon with your Department of Health logo
- ✅ Full-screen standalone experience
- ✅ Offline functionality via service worker
- ✅ Fast loading from cache
- ✅ Native app-like experience

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No install prompt | Browser may not support PWA or app already installed |
| Icon not showing | Clear browser cache and reinstall |
| App not loading offline | Service worker may need deployment |
| iOS installation | Use Safari, then "Share" → "Add to Home Screen" |

---

**Generated on**: January 22, 2026  
**Department**: South African Department of Health  
**System**: TDHS Health Promotion Reports
