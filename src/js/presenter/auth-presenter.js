import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';
import Swal from 'sweetalert2';

class AuthPresenter {
    constructor({ view }) {
        this._view = view;
    }

    async handleLogin(email, password) {
        if (!email || !password) {
            Swal.fire('Validation Error', 'Email and password are required.', 'warning');
            return;
        }
        this._view.showLoading();
        this._view.clearError();

        try {
            const response = await StoryApiSource.login({ email, password });
            if (!response.error) {
                AuthModel.saveCredentials(response.loginResult);
                document.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: true } }));
                 Swal.fire({
                     icon: 'success',
                     title: 'Login Successful!',
                     text: `Welcome back, ${response.loginResult.name}!`,
                     timer: 1500,
                     showConfirmButton: false
                 }).then(() => {
                     window.location.hash = '#/home';
                 });
            } else {
                this._view.showError(response.message || 'Login failed.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            this._view.showError(error.message || 'An error occurred during login.');
        } finally {
            this._view.hideLoading();
        }
    }

    async handleRegister(name, email, password) {
        if (!name || !email || !password) {
             Swal.fire('Validation Error','Name, email, and password are required.', 'warning');
             return;
        }
        if (password.length < 8) {
             Swal.fire('Validation Error','Password must be at least 8 characters long.', 'warning');
             return;
        }
        this._view.showLoading();
        this._view.clearError();

        try {
            const response = await StoryApiSource.register({ name, email, password });
            if (!response.error) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Your account has been created. Please login.',
                    confirmButtonText: 'Go to Login'
                }).then(() => {
                     window.location.hash = '#/login';
                });
            } else {
                this._view.showError(response.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Register Error:', error);
            this._view.showError(error.message || 'An error occurred during registration.');
        } finally {
            this._view.hideLoading();
        }
    }

    handleLogout() {
        AuthModel.clearCredentials();
    }
}

export default AuthPresenter;