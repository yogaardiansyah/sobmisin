const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in the browser');
      return;
    }
  
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
      console.log('Service Worker registration successful with scope: ', registration.scope);
  
  
    } catch (error) {
      console.error(`Service Worker registration failed: ${error}`);
    }
  };
  
  export default registerServiceWorker;
