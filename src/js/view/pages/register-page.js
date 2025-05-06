import Swal from 'sweetalert2';

const RegisterPage = {
    render() {
        return `
            <div class="container register-container">
                <h2>Register</h2>
                 <div id="registerErrorMessage" class="error-message" style="display: none;"></div>
                <form id="registerForm" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" required aria-required="true" autocomplete="name">
                    </div>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required aria-required="true" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="password">Password (min. 8 characters):</label>
                        <input type="password" id="password" name="password" required aria-required="true" minlength="8" autocomplete="new-password">
                    </div>
                    <button type="submit" id="registerSubmitButton">
                       <span class="button-text">Register</span>
                       <span class="button-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i> Registering...</span>
                    </button>
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
        const errorMessageDiv = document.getElementById('registerErrorMessage');
        const submitButton = document.getElementById('registerSubmitButton');
        const buttonText = submitButton.querySelector('.button-text');
        const buttonLoading = submitButton.querySelector('.button-loading');


        if (form && authPresenter) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                errorMessageDiv.style.display = 'none';
                const name = nameInput.value;
                const email = emailInput.value;
                const password = passwordInput.value;
                 authPresenter.handleRegister(name, email, password);
            });
        }

          RegisterPage.viewUtils = {
             showLoading: () => {
                  if (submitButton) submitButton.disabled = true;
                  if (buttonText) buttonText.style.display = 'none';
                  if (buttonLoading) buttonLoading.style.display = 'inline-flex';
             },
             hideLoading: () => {
                  if (submitButton) submitButton.disabled = false;
                  if (buttonText) buttonText.style.display = 'inline';
                  if (buttonLoading) buttonLoading.style.display = 'none';
             },
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
         authPresenter._view = RegisterPage.viewUtils;
    }
};

export default RegisterPage;