import Auth from '../utils/auth.js';

const AuthModel = {
    saveCredentials(loginResult) {
        if (!loginResult || !loginResult.token) {
            console.error('Invalid login result:', loginResult);
            return;
        }
        Auth.setToken(loginResult.token);
        sessionStorage.setItem('userName', loginResult.name || 'User');
        sessionStorage.setItem('userId', loginResult.userId || '');
        console.log('Credentials saved.');
    },

    clearCredentials() {
        Auth.removeToken();
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userId');
        console.log('Credentials cleared.');
        document.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: false } }));
    },

    isLoggedIn() {
        const token = Auth.getToken();
        return !!token;
    },

    getUserName() {
        return sessionStorage.getItem('userName');
    },

    getUserId() {
        return sessionStorage.getItem('userId');
    }
};

window.addEventListener('storage', (event) => {
    if (event.key === Auth.STORAGE_KEY && !event.newValue) {
      AuthModel.clearCredentials();
       if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
            window.location.hash = '#/login';
       }
    }
});


export default AuthModel;