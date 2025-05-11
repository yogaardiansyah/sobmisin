import "../styles/main.css";
import initRouter from "./router/router.js";
import registerServiceWorker from "./utils/sw-register.js";
import initPushNotifications from "./utils/push-notification.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Application Start");

  initRouter();

  registerServiceWorker();

  initPushNotifications();

  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
      skipLink.addEventListener("click", function (event) {
          event.preventDefault();
          this.blur();
          const main = document.getElementById("mainContent");
          if(main) {
              main.setAttribute('tabindex', -1);
              main.focus();
              main.scrollIntoView();
          }
      });
  } else {
    console.warn("Skip link element not found.");
  }
});
