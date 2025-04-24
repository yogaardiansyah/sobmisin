// src/js/view/pages/login-page.js
const LoginPage = {
    render() {
        return `
            <div class="container login-container">
                <h2>Login</h2>
                <div id="errorMessage" class="error-message" style="display: none;"></div>
                <div id="loadingIndicator" class="loading-indicator" style="display: none;">Logging in...</div>
                <form id="loginForm" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required aria-required="true">
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required aria-required="true" minlength="8">
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p>Don't have an account? <a href="#/register">Register here</a></p>
            </div>
        `;
    },

    setupEventListeners(authPresenter) {
        const form = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessageDiv = document.getElementById('errorMessage');
        const loadingIndicator = document.getElementById('loadingIndicator');

        if (form && authPresenter) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const email = emailInput.value;
                const password = passwordInput.value;
                // Pass control to the presenter
                authPresenter.handleLogin(email, password);
            });
        }

         // Add methods for the presenter to call back to update this specific view
         // This decouples MainView from knowing specific page element IDs
         LoginPage.viewUtils = {
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
         authPresenter._view = LoginPage.viewUtils;
    }
};

export default LoginPage;