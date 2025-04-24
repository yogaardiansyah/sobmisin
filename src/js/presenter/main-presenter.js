// src/js/presenter/main-presenter.js
import AuthModel from '../model/auth-model.js';
import AuthPresenter from './auth-presenter.js';
import StoryPresenter from './story-presenter.js';

// Import page view generators
import LoginPage from '../view/pages/login-page.js';
import RegisterPage from '../view/pages/register-page.js';
import HomePage from '../view/pages/home-page.js';
import AddStoryPage from '../view/pages/add-story-page.js';

class MainPresenter {
    constructor(mainView) {
        this._mainView = mainView;
        this._authPresenter = new AuthPresenter({ view: this._mainView }); // MainView can handle errors/loading globally
        this._storyPresenter = new StoryPresenter({
            mainView: this._mainView,
            homePageView: HomePage, // Pass the rendering functions/modules
            addStoryPageView: AddStoryPage,
        });

        // Initial setup for navigation and logout button visibility
        this._updateNavigation();
        document.addEventListener('auth-change', () => this._updateNavigation());

        // Handle logout button click
        const logoutButton = document.getElementById('logoutButton');
        if(logoutButton) {
             logoutButton.addEventListener('click', () => {
                 this._authPresenter.handleLogout();
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
             // Close menu if clicking outside
             document.body.addEventListener('click', () => {
                 nav.classList.remove('open');
             });
             nav.addEventListener('click', (event) => {
                 event.stopPropagation(); // Prevent body click from closing when clicking inside nav
             });
         }
    }

    _updateNavigation() {
        const isLoggedIn = AuthModel.isLoggedIn();
        const logoutButton = document.getElementById('logoutButton');
        const navLinks = document.querySelectorAll('#navigationDrawer ul li a'); // Adjust selector if needed

        if (logoutButton) {
            logoutButton.style.display = isLoggedIn ? 'block' : 'none';
        }

        // Hide/show nav links based on login status
        navLinks.forEach(link => {
             const href = link.getAttribute('href');
             if (href === '#/login' || href === '#/register') {
                 link.parentElement.style.display = isLoggedIn ? 'none' : 'list-item';
             } else {
                 // Optionally hide protected links if not logged in,
                 // but routing handles redirection anyway.
                 // link.parentElement.style.display = isLoggedIn ? 'list-item' : 'none';
             }
        });

        // Close mobile menu after navigation (if open)
        const nav = document.getElementById('navigationDrawer');
        if (nav) {
            nav.classList.remove('open');
        }
    }

    // --- Page Loading Methods ---

     _cleanupCurrentPage() {
         // Ask the StoryPresenter to clean up its resources before loading a new page
         if (this._storyPresenter && typeof this._storyPresenter.cleanupPageResources === 'function') {
             this._storyPresenter.cleanupPageResources();
         }
         // Add cleanup for other presenters if they manage resources like maps/camera
     }


    showLoginPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(
             () => LoginPage.render(),
             () => LoginPage.setupEventListeners(this._authPresenter) // Pass presenter to setup listeners
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
         // Let StoryPresenter handle fetching and rendering
         this._storyPresenter.displayHomePage();
    }

    showAddStoryPage() {
         this._cleanupCurrentPage();
         // Let StoryPresenter handle rendering and setup
         this._storyPresenter.displayAddStoryPage();
    }

     showNotFoundPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(() => '<div class="container"><h2>404 - Page Not Found</h2><p>The page you requested does not exist.</p><a href="#/home">Go Home</a></div>');
     }
}

export default MainPresenter;