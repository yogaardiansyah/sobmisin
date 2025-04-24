// src/js/presenter/auth-presenter.js
import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';
import Swal from 'sweetalert2'; // Import Swal

class AuthPresenter {
    constructor({ view }) {
        this._view = view; // Ini akan di-override oleh viewUtils dari login/register page
    }

    // --- Perubahan handleLogin ---
    async handleLogin(email, password) {
        if (!email || !password) {
            Swal.fire('Validation Error', 'Email and password are required.', 'warning'); // Gunakan Swal
            return;
        }
        this._view.showLoading(); // Panggil showLoading dari viewUtils
        this._view.clearError(); // Bersihkan error lama

        try {
            const response = await StoryApiSource.login({ email, password });
            if (!response.error) {
                AuthModel.saveCredentials(response.loginResult);
                document.dispatchEvent(new CustomEvent('auth-change', { detail: { loggedIn: true } }));
                // Tampilkan notifikasi sukses
                 Swal.fire({
                     icon: 'success',
                     title: 'Login Successful!',
                     text: `Welcome back, ${response.loginResult.name}!`,
                     timer: 1500, // Tutup otomatis
                     showConfirmButton: false
                 }).then(() => {
                     window.location.hash = '#/home'; // Navigate setelah notif ditutup
                 });
            } else {
                this._view.showError(response.message || 'Login failed.'); // Tampilkan error di view
            }
        } catch (error) {
            console.error('Login Error:', error);
            this._view.showError(error.message || 'An error occurred during login.'); // Tampilkan error di view
        } finally {
            this._view.hideLoading(); // Panggil hideLoading dari viewUtils
        }
    }

    // --- Perubahan handleRegister ---
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
                // Tampilkan notifikasi sukses registrasi
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Your account has been created. Please login.',
                    confirmButtonText: 'Go to Login'
                }).then(() => {
                     window.location.hash = '#/login'; // Navigate ke login setelah OK
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
        // Navigasi sudah di handle di MainPresenter setelah konfirmasi Swal
        // window.location.hash = '#/login';
    }
}

export default AuthPresenter;