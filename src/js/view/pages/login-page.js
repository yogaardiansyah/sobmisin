// src/js/view/pages/login-page.js
import Swal from 'sweetalert2'; // Import Swal

const LoginPage = {
    render() {
        return `
            <div class="container login-container">
                <h2>Login</h2>
                <div id="loginErrorMessage" class="error-message" style="display: none;"></div>
                <form id="loginForm" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required aria-required="true" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required aria-required="true" minlength="8" autocomplete="current-password">
                    </div>
                    <button type="submit" id="loginSubmitButton">
                       <span class="button-text">Login</span>
                       <span class="button-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i> Logging in...</span>
                    </button>
                </form>
                <p>Don't have an account? <a href="#/register">Register here</a></p>
            </div>
        `;
    },

    setupEventListeners(authPresenter) {
        const form = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessageDiv = document.getElementById('loginErrorMessage'); // ID spesifik
        const submitButton = document.getElementById('loginSubmitButton');
        const buttonText = submitButton.querySelector('.button-text');
        const buttonLoading = submitButton.querySelector('.button-loading');

        if (form && authPresenter) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                errorMessageDiv.style.display = 'none'; // Sembunyikan error lama
                const email = emailInput.value;
                const password = passwordInput.value;
                authPresenter.handleLogin(email, password);
            });
        }

         LoginPage.viewUtils = {
             // --- Perubahan showLoading ---
             showLoading: () => {
                 if (submitButton) submitButton.disabled = true;
                 if (buttonText) buttonText.style.display = 'none';
                 if (buttonLoading) buttonLoading.style.display = 'inline-flex'; // Gunakan inline-flex agar ikon dan teks sejajar
             },
             hideLoading: () => {
                  if (submitButton) submitButton.disabled = false;
                  if (buttonText) buttonText.style.display = 'inline';
                  if (buttonLoading) buttonLoading.style.display = 'none';
             },
             // --- Perubahan showError (bisa pakai div atau Swal) ---
             showError: (message) => {
                 // Pilihan 1: Tampilkan di div error spesifik
                 if (errorMessageDiv) {
                     errorMessageDiv.textContent = message;
                     errorMessageDiv.style.display = 'block';
                 }
                 // Pilihan 2: Gunakan SweetAlert (lebih konsisten)
                 // Swal.fire('Login Failed', message, 'error');
             },
             clearError: () => {
                 if (errorMessageDiv) {
                     errorMessageDiv.textContent = '';
                     errorMessageDiv.style.display = 'none';
                 }
             }
         };
         authPresenter._view = LoginPage.viewUtils;
    }
};

export default LoginPage;