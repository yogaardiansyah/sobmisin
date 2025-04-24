// src/js/view/pages/register-page.js
const RegisterPage = {
    render() {
        return `
            <div class="container register-container">
                <h2>Register</h2>
                 <div id="errorMessage" class="error-message" style="display: none;"></div>
                 <div id="loadingIndicator" class="loading-indicator" style="display: none;">Registering...</div>
                <form id="registerForm" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" required aria-required="true">
                    </div>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required aria-required="true">
                    </div>
                    <div class="form-group">
                        <label for="password">Password (min. 8 characters):</label>
                        <input type="password" id="password" name="password" required aria-required="true" minlength="8">
                    </div>
                    <button type="submit">Register</button>
                </form>
                <p>Already have an account? <a href="#/login">Login here</a></p>
            </div>
        `;
    },

     setupEventListeners(authPresenter) {
        const form = document.getElementById('registerForm');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessageDiv = document.getElementById('errorMessage');
        const loadingIndicator = document.getElementById('loadingIndicator');

        if (form && authPresenter) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const name = nameInput.value;
                const email = emailInput.value;
                const password = passwordInput.value;
                // Pass control to the presenter
                 authPresenter.handleRegister(name, email, password);
            });
        }

         // Add view utils similar to LoginPage
          RegisterPage.viewUtils = {
             showLoading: () => { if (loadingIndicator) loadingIndicator.style.display = 'block'; },
             hideLoading: () => { if (loadingIndicator) loadingIndicator.style.display = 'none'; },
             showError: (message) => {
                 if (errorMessageDiv) {
                     errorMessageDiv.textContent = message;
                     errorMessageDiv.style.display = 'block';
                 }
             },
             clearError: () => {
                 if (errorMessageDiv) {
                     errorMessageDiv.textContent = '';
                     errorMessageDiv.style.display = 'none';
                 }
             }
         };
         // Give presenter access to these view utils
         authPresenter._view = RegisterPage.viewUtils;
    }
};

export default RegisterPage;