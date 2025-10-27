// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Type definitions for Google Identity Services
interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

type PromptMomentNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
};

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    prompt: (cb?: (notification: PromptMomentNotification) => void) => void;
    renderButton?: (
      parent: HTMLElement,
      options: Record<string, unknown>,
    ) => void;
  };
}

interface WindowWithGoogle extends Window {
  google?: {
    accounts: GoogleAccounts;
  };
}

declare const window: WindowWithGoogle;

let _credentialCallback: ((credential: string) => Promise<void> | void) | null = null;
let _initialized = false;

const ensureScript = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.google) return resolve();
    const existing = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    document.body.appendChild(script);
  });

export const initGoogleAuth = async (onCredential?: (credential: string) => Promise<void> | void) => {
  _credentialCallback = onCredential || null;
  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set');
    return;
  }
  await ensureScript();
  try {
    if (!window.google || _initialized) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: GoogleCredentialResponse) => {
        const credential = resp?.credential;
        if (credential) {
          if (_credentialCallback) _credentialCallback(credential);
          else console.log('Google credential received (no callback registered)');
        }
      },
    });
    _initialized = true;
  } catch (err) {
    console.error('Failed to initialize Google Identity Services', err);
  }
};

export const handleGoogleLogin = async () => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      alert('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment.');
      return;
    }
    await ensureScript();
    // prompt the credential chooser (the callback passed to initGoogleAuth will receive the token)
    const serverApi = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
    const serverBase = serverApi.replace(/\/?api\/?$/, '');
    const oauthRedirectUrl = `${serverBase}/api/auth/google`;

    const fallbackToRedirect = () => {
      // Fall back to the classic OAuth redirect flow
      window.location.href = oauthRedirectUrl;
    };

    if (window.google?.accounts?.id) {
      // Try One Tap prompt; if it's not displayed or skipped, fall back to redirect flow
      let didCallback = false;
      const timer = setTimeout(() => {
        if (!didCallback) fallbackToRedirect();
      }, 1500);

      window.google.accounts.id.prompt((notification) => {
        didCallback = true;
        clearTimeout(timer);
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          fallbackToRedirect();
        }
      });
    } else {
      alert('Google SDK failed to load.');
    }
  } catch (error) {
    console.error('Google login error:', error);
    alert('Failed to login with Google');
  }
};

export const handleGoogleSignup = async () => {
  // For now, the signup flow is the same: prompt can be used and backend should decide whether to create an account
  await handleGoogleLogin();
};
