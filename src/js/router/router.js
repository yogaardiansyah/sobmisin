// src/js/router/router.js
import MainPresenter from '../presenter/main-presenter.js';
import MainView from '../view/main-view.js';
import AuthModel from '../model/auth-model.js';

const mainContent = document.getElementById('mainContent');
if (!mainContent) {
    throw new Error("Fatal Error: #mainContent element not found in HTML.");
}

const mainView = new MainView(mainContent);
const mainPresenter = new MainPresenter(mainView);

const routes = {
  '/login': () => mainPresenter.showLoginPage(),
  '/register': () => mainPresenter.showRegisterPage(),
  '/': () => mainPresenter.showHomePage(),
  '/home': () => mainPresenter.showHomePage(),
  '/add-story': () => mainPresenter.showAddStoryPage(), // Rute target
};

const publicRoutes = ['/login', '/register'];

// --- PERUBAHAN DI SINI ---
// Definisikan rute yang bisa diakses tamu meskipun bukan public (login/register)
const guestAccessibleRoutes = ['/add-story'];
// --------------------------

const handleRouteChange = () => {
  const hash = window.location.hash.substring(1) || '/';
  const [path, param] = hash.split('/').filter(s => s);
  const baseRoute = `/${path || ''}`;

  console.log(`Routing attempt: hash='${hash}', baseRoute='${baseRoute}', param='${param}'`);


  const handler = routes[baseRoute] || null;

  const isLoggedIn = AuthModel.isLoggedIn();

  // Redirect logged-in users away from login/register
  if (isLoggedIn && publicRoutes.includes(baseRoute)) {
    console.log('Already logged in, redirecting to home');
    window.location.hash = '/home';
    return;
  }

  // --- PERUBAHAN DI SINI ---
  // Redirect non-logged-in users trying to access protected routes,
  // KECUALI rute tersebut ada di guestAccessibleRoutes
  if (!isLoggedIn && !publicRoutes.includes(baseRoute) && !guestAccessibleRoutes.includes(baseRoute) && baseRoute !== '/') {
     console.log('Not logged in and accessing protected route, redirecting to login for route:', baseRoute);
     window.location.hash = '/login';
     return;
  }
  // --------------------------


  if (handler) {
     console.log(`Executing handler for: ${baseRoute}`);
     if (param && typeof handler === 'function' && handler.length === 1) {
         handler(param);
     } else if (typeof handler === 'function') {
         handler();
     }
  } else {
     console.log(`No handler found for route: ${baseRoute}. Showing 404.`);
     mainPresenter.showNotFoundPage();
  }
};

const initRouter = () => {
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded, initial route check.');
    handleRouteChange();
  });
};

export default initRouter;