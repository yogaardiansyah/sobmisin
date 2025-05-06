const Auth = {
    STORAGE_KEY: 'storyAppAuthToken',

    getToken() {
        return localStorage.getItem(this.STORAGE_KEY);
    },

    setToken(token) {
        if (token) {
            localStorage.setItem(this.STORAGE_KEY, token);
        } else {
            console.warn('Attempted to set null or undefined token.');
        }
    },

    removeToken() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

export default Auth;