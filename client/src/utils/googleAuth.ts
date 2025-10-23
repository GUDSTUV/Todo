// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let _credentialCallback: ((credential: string) => Promise<void> | void) | null = null;
let _initialized = false;

const ensureScript = (): Promise<void> =>
  new Promise((resolve) => {
    if ((window as any).google) return resolve();
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
    if (!(window as any).google || _initialized) return;
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: any) => {
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
    if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
      (window as any).google.accounts.id.prompt();
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
