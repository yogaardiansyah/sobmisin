import { runViewTransition } from '../utils/view-transition.js';
import Swal from 'sweetalert2';

class MainView {
    constructor(mainElement) {
        if (!mainElement) {
            throw new Error('Main element is required for MainView');
        }
        this._mainElement = mainElement;
    }

    renderPage(pageRenderer, presenterCallback = null) {
        runViewTransition(() => {
            this._mainElement.innerHTML = '';

            try {
                 const pageContent = pageRenderer();

                 if (pageContent instanceof HTMLElement) {
                     this._mainElement.appendChild(pageContent);
                 } else if (typeof pageContent === 'string') {
                     this._mainElement.innerHTML = pageContent;
                 } else {
                     console.error('Page renderer did not return valid content (HTML string or Element)');
                     this.showError('Failed to load page content.');
                     return;
                 }

                 if (presenterCallback && typeof presenterCallback === 'function') {
                     setTimeout(() => {
                         try {
                            presenterCallback();
                         } catch(callbackError) {
                             console.error("Error in presenter callback after render:", callbackError);
                             this.showError(`Error setting up page features: ${callbackError.message}`);
                         }
                     }, 50);
                 }
            } catch (renderError) {
                 console.error("Error rendering page:", renderError);
                 this.showError(`Failed to render page: ${renderError.message}`);
            }
        });
    }

    showLoading() {
         runViewTransition(() => {
             this._mainElement.innerHTML = `
                <div class="loading-indicator global-loading">
                    <div class="spinner"></div>
                    <span>Loading Content...</span>
                </div>`;
         });
    }

    showError(message = 'An unexpected error occurred.') {
         Swal.fire({
             icon: 'error',
             title: 'Oops... Something went wrong!',
             text: message,
             confirmButtonText: 'Go Home',
             footer: '<a href="#/home">Or click here to go home</a>'
         }).then((result) => {
             if (result.isConfirmed) {
                  window.location.hash = '#/home';
             }
         });
    }

     clearError() {
     }
}

export default MainView;