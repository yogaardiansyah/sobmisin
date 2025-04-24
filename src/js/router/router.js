// src/js/router/router.js
import MainPresenter from '../presenter/main-presenter.js';
import MainView from '../view/main-view.js';
import AuthModel from '../model/auth-model.js';

const mainContent = document.getElementById('mainContent');
if (!mainContent) {
    throw new Error("Fatal Error: #mainContent element not found in HTML.");
}

const mainView = new MainView(mainContent);
const mainPresenter = new MainPresenter(mainView); // Inject the view

const routes = {
  '/login': () => mainPresenter.showLoginPage(),
  '/register': () => mainPresenter.showRegisterPage(),
  '/': () => mainPresenter.showHomePage(), // Root redirects to home
  '/home': () => mainPresenter.showHomePage(),
  '/add-story': () => mainPresenter.showAddStoryPage(),
  // '/detail/:id': (id) => mainPresenter.showDetailPage(id), // Example for detail page
};

const publicRoutes = ['/login', '/register']; // Routes accessible without login

const handleRouteChange = () => {
  const hash = window.location.hash.substring(1) || '/';
  const [path, param] = hash.split('/').filter(s => s); // Handle potential params like /detail/id
  const baseRoute = `/${path || ''}`; // Use '/' for empty path

  console.log(`Routing attempt: hash='${hash}', baseRoute='${baseRoute}', param='${param}'`);


  const handler = routes[baseRoute] || null; // Find the handler function

  const isLoggedIn = AuthModel.isLoggedIn();

  // Redirect logged-in users away from login/register
  if (isLoggedIn && publicRoutes.includes(baseRoute)) {
    console.log('Already logged in, redirecting to home');
    window.location.hash = '/home';
    return; // Stop further processing
  }

  // Redirect non-logged-in users trying to access protected routes
  if (!isLoggedIn && !publicRoutes.includes(baseRoute) && baseRoute !== '/') { // Allow access to root initially
     console.log('Not logged in, redirecting to login');
     window.location.hash = '/login';
     return; // Stop further processing
  }

  if (handler) {
     console.log(`Executing handler for: ${baseRoute}`);
     // Pass param if the handler expects it (e.g., for detail page)
     if (param && typeof handler === 'function' && handler.length === 1) {
         handler(param);
     } else if (typeof handler === 'function') {
         handler();
     }
  } else {
     console.log(`No handler found for route: ${baseRoute}. Showing 404.`);
     mainPresenter.showNotFoundPage(); // Show a 404 page
  }
};

const initRouter = () => {
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded, initial route check.');
    handleRouteChange(); // Handle initial route
  });
};

export default initRouter;