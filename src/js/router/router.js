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
  '/add-story': () => mainPresenter.showAddStoryPage(),
  '/detail': (id) => mainPresenter.showDetailPage(id),
};

const publicRoutes = ['/login', '/register'];
const guestAccessibleRoutes = ['/add-story'];

const handleRouteChange = () => {
  const hash = window.location.hash.substring(1) || '/';
  const pathParts = hash.split('/');
  const baseSegment = pathParts[1] || '';
  const param = pathParts[2] || null;

  const baseRoute = `/${baseSegment}`;

  console.log(`Routing attempt: hash='${hash}', baseRoute='${baseRoute}', param='${param}'`);

  const handler = routes[baseRoute] || null;

  const isLoggedIn = AuthModel.isLoggedIn();

  if (isLoggedIn && publicRoutes.includes(baseRoute)) {
    console.log('Already logged in, redirecting to home');
    window.location.hash = '/home';
    return;
  }

  const requiresLogin = !publicRoutes.includes(baseRoute) && !guestAccessibleRoutes.includes(baseRoute) && baseRoute !== '/';
  if (!isLoggedIn && requiresLogin) {
     console.log('Not logged in and accessing protected route, redirecting to login for route:', baseRoute);
     window.location.hash = '/login';
     return;
  }

  if (handler) {
     console.log(`Executing handler for: ${baseRoute}`);
     if (param && typeof handler === 'function') {
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