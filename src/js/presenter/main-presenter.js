import AuthModel from '../model/auth-model.js';
import AuthPresenter from './auth-presenter.js';
import StoryPresenter from './story-presenter.js';

import LoginPage from '../view/pages/login-page.js';
import RegisterPage from '../view/pages/register-page.js';
import HomePage from '../view/pages/home-page.js';
import AddStoryPage from '../view/pages/add-story-page.js';
import DetailPage from '../view/pages/detail-page.js';
import FavoriteStoriesPage from '../view/pages/favorite-stories-page.js';

import Swal from 'sweetalert2';

class MainPresenter {
    constructor(mainView) {
        this._mainView = mainView;
        this._authPresenter = new AuthPresenter({ view: this._mainView });
        this._storyPresenter = new StoryPresenter({
            mainView: this._mainView,
            homePageView: HomePage,
            addStoryPageView: AddStoryPage,
            detailPageView: DetailPage,
            favoriteStoriesPageView: FavoriteStoriesPage,
        });

        this._setupNavigationAndLogout();
    }

    _setupNavigationAndLogout() {
        this._updateNavigation();
        document.addEventListener('auth-change', () => this._updateNavigation());

        const logoutButton = document.getElementById('logoutButton');
        if(logoutButton) {
             logoutButton.addEventListener('click', () => {
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
                         Swal.fire({
                            title: 'Logged Out!',
                            text: 'You have been successfully logged out.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                         }).then(() => {
                             window.location.hash = '#/login';
                         });
                     }
                 });
             });
        } else {
            console.error('Logout button not found');
        }

         const menuButton = document.getElementById('menuButton');
         const nav = document.getElementById('navigationDrawer');
         if (menuButton && nav) {
             menuButton.addEventListener('click', (event) => {
                 event.stopPropagation();
                 nav.classList.toggle('open');
             });
             nav.addEventListener('click', (event) => {
                if (event.target.tagName === 'A' || event.target.closest('A')) {
                    nav.classList.remove('open');
                }
                event.stopPropagation();
             });
         }
    }

    _updateNavigation() {
        const isLoggedIn = AuthModel.isLoggedIn();
        const logoutButton = document.getElementById('logoutButton');
        const navLinks = document.querySelectorAll('#navigationDrawer ul li a');
        const favoriteLink = document.querySelector('#navigationDrawer ul li a[href="#/favorites"]');

        if (logoutButton) {
            logoutButton.style.display = isLoggedIn ? 'block' : 'none';
        }

        navLinks.forEach(link => {
             const href = link.getAttribute('href');
             if (href === '#/login' || href === '#/register') {
                 link.parentElement.style.display = isLoggedIn ? 'none' : 'list-item';
             }
        });
        
        if (favoriteLink) {
            favoriteLink.parentElement.style.display = isLoggedIn ? 'list-item' : 'none';
        }


        const nav = document.getElementById('navigationDrawer');
        if (nav && nav.classList.contains('open')) {
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
         this._updateNavigation();
    }

    showRegisterPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(
            () => RegisterPage.render(),
            () => RegisterPage.setupEventListeners(this._authPresenter)
        );
        this._updateNavigation();
    }

    showHomePage() {
         this._cleanupCurrentPage();
         this._storyPresenter.displayHomePage();
         this._updateNavigation();
    }

    showAddStoryPage() {
         this._cleanupCurrentPage();
         this._storyPresenter.displayAddStoryPage();
         this._updateNavigation();
    }

    showDetailPage(storyId) {
        if (!storyId) {
             console.error("Story ID is required for detail page.");
             this.showNotFoundPage();
             return;
        }
         this._cleanupCurrentPage();
         this._storyPresenter.displayDetailPage(storyId);
         this._updateNavigation();
     }
    
    showFavoriteStoriesPage() {
        this._cleanupCurrentPage();
        this._storyPresenter.displayFavoriteStoriesPage();
        this._updateNavigation();
    }


     showNotFoundPage() {
         this._cleanupCurrentPage();
         this._mainView.renderPage(() => '<div class="container"><h2>404 - Page Not Found</h2><p>The page you requested does not exist.</p><a href="#/home">Go Home</a></div>');
         this._updateNavigation();
     }
}

export default MainPresenter;