import Auth from '../utils/auth.js';

const AuthModel = {
    saveCredentials(loginResult) {
        if (!loginResult || !loginResult.token) {
            console.error('Invalid login result:', loginResult);
            return;
        }
        Auth.setToken(loginResult.token);
        // Store user info in sessionStorage for easy access during the session
        sessionStorage.setItem('userName', loginResult.name || 'User');
        sessionStorage.setItem('userId', loginResult.userId || '');
        console.log('Credentials saved.');
    },

    clearCredentials() {
        Auth.removeToken();
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userId');
        console.log('Credentials cleared.');
        // Optionally dispatch a custom event to notify components about logout
        document.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: false } }));
    },

    isLoggedIn() {
        const token = Auth.getToken();
        // console.log('Checking login status, token exists:', !!token);
        return !!token;
    },

    getUserName() {
        return sessionStorage.getItem('userName');
    },

    getUserId() {
        return sessionStorage.getItem('userId');
    }
};

// Listen for storage events from other tabs (optional but good practice)
window.addEventListener('storage', (event) => {
    if (event.key === Auth.STORAGE_KEY && !event.newValue) {
      // Token removed in another tab, treat as logout
      AuthModel.clearCredentials();
      // Force UI update or redirect if needed
       if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
            window.location.hash = '#/login';
       }
    }
});


export default AuthModel;