// src/js/presenter/auth-presenter.js
import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';

class AuthPresenter {
    constructor({ view }) {
        this._view = view;
        // No initial API calls needed for login/register pages usually
    }

    async handleLogin(email, password) {
        if (!email || !password) {
            this._view.showError('Email and password are required.');
            return;
        }
        this._view.showLoading(); // Show loading indicator in the specific view/form
        try {
            const response = await StoryApiSource.login({ email, password });
            if (!response.error) {
                AuthModel.saveCredentials(response.loginResult);
                this._view.clearError(); // Clear any previous error
                // Dispatch auth change event
                document.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: true } }));
                window.location.hash = '#/home'; // Navigate to home
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
            this._view.showError('Name, email, and password are required.');
            return;
        }
        if (password.length < 8) {
            this._view.showError('Password must be at least 8 characters long.');
            return;
        }
        this._view.showLoading();
        try {
            const response = await StoryApiSource.register({ name, email, password });
            if (!response.error) {
                this._view.clearError();
                 // Optionally show a success message before redirecting
                alert('Registration successful! Please login.');
                window.location.hash = '#/login'; // Navigate to login page
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
        // Dispatch auth change event handled in model now
        window.location.hash = '#/login'; // Navigate to login after logout
    }
}

export default AuthPresenter;