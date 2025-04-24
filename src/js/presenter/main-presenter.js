// src/js/presenter/main-presenter.js
import AuthModel from '../model/auth-model.js';
import AuthPresenter from './auth-presenter.js';
import StoryPresenter from './story-presenter.js';

// Import page view generators
import LoginPage from '../view/pages/login-page.js';
import RegisterPage from '../view/pages/register-page.js';
import HomePage from '../view/pages/home-page.js';
import AddStoryPage from '../view/pages/add-story-page.js';
import DetailPage from '../view/pages/detail-page.js'; // <-- IMPORT BARU

// Import Sweet Alert
import Swal from 'sweetalert2'; // <-- IMPORT BARU

class MainPresenter {
    constructor(mainView) {
        this._mainView = mainView;
        this._authPresenter = new AuthPresenter({ view: this._mainView });
        this._storyPresenter = new StoryPresenter({
            mainView: this._mainView,
            homePageView: HomePage,
            addStoryPageView: AddStoryPage,
            detailPageView: DetailPage, // <-- PASS DETAIL PAGE VIEW
        });

        this._setupNavigationAndLogout(); // Gabungkan setup
    }

    _setupNavigationAndLogout() {
        // Initial setup for navigation and logout button visibility
        this._updateNavigation();
        document.addEventListener('auth-change', () => this._updateNavigation());

        // Handle logout button click
        const logoutButton = document.getElementById('logoutButton');
        if(logoutButton) {
             logoutButton.addEventListener('click', () => {
                 // Konfirmasi logout dengan SweetAlert
                 Swal.fire({
                     title: 'Are you sure?',
                     text: "You will be logged out!",
                     icon: 'warning',
                     showCancelButton: true,
                     confirmButtonColor: '#3085d6',
                     cancelButtonColor: '#d33',
                     confirmButtonText: 'Yes, log out!'
                 }).then((result) => {
                     if (result.isConfirmed) {
                         this._authPresenter.handleLogout();
                         // Tampilkan notifikasi sukses logout
                         Swal.fire({
                            title: 'Logged Out!',
                            text: 'You have been successfully logged out.',
                            icon: 'success',
                            timer: 1500, // Tutup otomatis setelah 1.5 detik
                            showConfirmButton: false
                         }).then(() => {
                             // Arahkan ke halaman login setelah logout
                             window.location.hash = '#/login';
                         });
                     }
                 });
             });
        } else {
            console.error('Logout button not found');
        }

         // Menu toggle for mobile
         const menuButton = document.getElementById('menuButton');
         const nav = document.getElementById('navigationDrawer');
         if (menuButton && nav) {
             menuButton.addEventListener('click', (event) => {
                 event.stopPropagation();
                 nav.classList.toggle('open');
             });
             document.body.addEventListener('click', () => {
                 nav.classList.remove('open');
             });
             nav.addEventListener('click', (event) => {
                 event.stopPropagation();
             });
         }
    }

    _updateNavigation() {
        const isLoggedIn = AuthModel.isLoggedIn();
        const logoutButton = document.getElementById('logoutButton');
        const navLinks = document.querySelectorAll('#navigationDrawer ul li a');

        if (logoutButton) {
            logoutButton.style.display = isLoggedIn ? 'block' : 'none';
        }

        navLinks.forEach(link => {
             const href = link.getAttribute('href');
             if (href === '#/login' || href === '#/register') {
                 link.parentElement.style.display = isLoggedIn ? 'none' : 'list-item';
             }
             // Sembunyikan add story jika guest tidak diizinkan (opsional, tergantung logika bisnis)
             // if (href === '#/add-story' && !AuthModel.isLoggedIn() && !ALLOW_GUEST_POSTING) {
             //     link.parentElement.style.display = 'none';
             // }
        });

        const nav = document.getElementById('navigationDrawer');
        if (nav) {
            nav.classList.remove('open');
        }
    }

     _cleanupCurrentPage() {
         if (this._storyPresenter && typeof this._storyPresenter.cleanupPageResources === 'function') {
             this._storyPresenter.cleanupPageResources();
         }
     }


    showLoginPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(
             () => LoginPage.render(),
             () => LoginPage.setupEventListeners(this._authPresenter)
         );
    }

    showRegisterPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(
            () => RegisterPage.render(),
            () => RegisterPage.setupEventListeners(this._authPresenter)
        );
    }

    showHomePage() {
         this._cleanupCurrentPage();
         this._storyPresenter.displayHomePage();
    }

    showAddStoryPage() {
         this._cleanupCurrentPage();
         this._storyPresenter.displayAddStoryPage();
    }

    // --- METODE BARU UNTUK DETAIL ---
    showDetailPage(storyId) {
        if (!storyId) {
             console.error("Story ID is required for detail page.");
             this.showNotFoundPage(); // Tampilkan 404 jika ID tidak ada
             return;
        }
         this._cleanupCurrentPage();
         // Minta StoryPresenter untuk menampilkan halaman detail
         this._storyPresenter.displayDetailPage(storyId);
     }
    // --- AKHIR METODE BARU ---


     showNotFoundPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(() => '<div class="container"><h2>404 - Page Not Found</h2><p>The page you requested does not exist.</p><a href="#/home">Go Home</a></div>');
     }
}

export default MainPresenter;