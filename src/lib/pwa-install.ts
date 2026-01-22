/**
 * PWA Install Prompt Helper
 * This helps trigger the PWA install prompt on compatible browsers
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;

export function setupPWAInstallPrompt() {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
  }

  window.addEventListener('beforeinstallprompt', (e: any) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    deferredPrompt = null;
  });

  // For display mode detection
  window.matchMedia('(display-mode: standalone)').addListener((evt: any) => {
    isInstalled = evt.matches;
  });
}

export async function triggerPWAInstall() {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredPrompt = null;
    return true;
  }

  return false;
}

export function isAppInstalled() {
  return isInstalled;
}

export function canInstallApp() {
  return !!deferredPrompt && !isInstalled;
}
