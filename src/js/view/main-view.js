// src/js/view/main-view.js
import { runViewTransition } from '../utils/view-transition.js';
import Swal from 'sweetalert2'; // Import Swal untuk showError

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
                     this.showError('Failed to load page content.'); // Gunakan showError
                     return;
                 }

                 if (presenterCallback && typeof presenterCallback === 'function') {
                     setTimeout(() => {
                         try {
                            presenterCallback();
                         } catch(callbackError) {
                             console.error("Error in presenter callback after render:", callbackError);
                             this.showError(`Error setting up page features: ${callbackError.message}`); // Gunakan showError
                         }
                     }, 50); // Beri sedikit delay extra
                 }
            } catch (renderError) {
                 console.error("Error rendering page:", renderError);
                 this.showError(`Failed to render page: ${renderError.message}`); // Gunakan showError
            }
        });
    }

    // --- Perubahan showLoading ---
    showLoading() {
         runViewTransition(() => {
             this._mainElement.innerHTML = `
                <div class="loading-indicator global-loading">
                    <div class="spinner"></div>
                    <span>Loading Content...</span>
                </div>`;
         });
    }
    // --- Akhir Perubahan showLoading ---

    // --- Perubahan showError (gunakan SweetAlert) ---
    showError(message = 'An unexpected error occurred.') {
        // Error global bisa ditampilkan di main content, atau lebih baik via Modal
         Swal.fire({
             icon: 'error',
             title: 'Oops... Something went wrong!',
             text: message,
             confirmButtonText: 'Go Home', // Tombol untuk navigasi
             footer: '<a href="#/home">Or click here to go home</a>' // Link tambahan
         }).then((result) => {
             // Jika tombol "Go Home" diklik
             if (result.isConfirmed) {
                  window.location.hash = '#/home';
             }
         });
         // Kita juga bisa mengosongkan main content jika diinginkan
         // runViewTransition(() => {
         //     this._mainElement.innerHTML = `<div class="container error-container"><p>Redirecting or check the error message...</p></div>`;
         // });
    }
    // --- Akhir Perubahan showError ---

     clearError() {
        // Jika menggunakan Swal, tidak perlu clear manual dari DOM
        // Swal.close(); // Bisa dipanggil jika perlu menutup paksa
     }
}

export default MainView;