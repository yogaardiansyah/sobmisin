import Swal from 'sweetalert2';

const RegisterPage = {
    _boundSubmitHandler: null,
    _authPresenterInstance: null,

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
                    <button type="submit" id="registerSubmitButton" class="button">
                       <span class="button-text">Register</span>
                       <span class="button-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i> Registering...</span>
                    </button>
                </form>
                <p>Already have an account? <a href="#/login">Login here</a></p>
            </div>
        `;
    },

    _cleanupEventListeners() {
        const form = document.getElementById('registerForm');
        if (form && this._boundSubmitHandler) {
            form.removeEventListener('submit', this._boundSubmitHandler);
            console.log('RegisterPage: Submit listener removed.');
            this._boundSubmitHandler = null;
        }
    },

     setupEventListeners(authPresenter) {
        this._authPresenterInstance = authPresenter;
        const form = document.getElementById('registerForm');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessageDiv = document.getElementById('registerErrorMessage');
        const submitButton = document.getElementById('registerSubmitButton');

        if (!form || !authPresenter) {
            console.error("RegisterPage: Form or AuthPresenter not found for event setup.");
            return;
        }

        this._cleanupEventListeners();

        this._boundSubmitHandler = async (event) => {
            event.preventDefault();
            if(errorMessageDiv) errorMessageDiv.style.display = 'none';
            
            const name = nameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            if (this._authPresenterInstance && this._authPresenterInstance._view && typeof this._authPresenterInstance._view.showLoading === 'function') {
                this._authPresenterInstance._view.showLoading();
            } else if (submitButton) {
                submitButton.disabled = true;
                const buttonText = submitButton.querySelector('.button-text');
                const buttonLoading = submitButton.querySelector('.button-loading');
                if(buttonText) buttonText.style.display = 'none';
                if(buttonLoading) buttonLoading.style.display = 'inline-flex';
            }
            
            try {
                await this._authPresenterInstance.handleRegister(name, email, password);
            } catch (e) {
                console.error("RegisterPage: Error during handleRegister call", e);
                if (this._authPresenterInstance && this._authPresenterInstance._view && typeof this._authPresenterInstance._view.showError === 'function') {
                    this._authPresenterInstance._view.showError(e.message || "Registration failed unexpectedly.");
                }
            }
        };

        form.addEventListener('submit', this._boundSubmitHandler);
        console.log('RegisterPage: Submit listener added.');

        const viewUtils = {
             showLoading: () => {
                  if (submitButton) submitButton.disabled = true;
                  const buttonText = submitButton.querySelector('.button-text');
                  const buttonLoading = submitButton.querySelector('.button-loading');
                  if (buttonText) buttonText.style.display = 'none';
                  if (buttonLoading) buttonLoading.style.display = 'inline-flex';
             },
             hideLoading: () => {
                  if (submitButton) submitButton.disabled = false;
                  const buttonText = submitButton.querySelector('.button-text');
                  const buttonLoading = submitButton.querySelector('.button-loading');
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
         
         if (typeof authPresenter.setView === 'function') {
            authPresenter.setView(viewUtils);
         } else {
            authPresenter._view = viewUtils;
         }
    }
};

export default RegisterPage;