import "../styles/main.css";

import initRouter from "./router/router.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Application Start");
  initRouter();
});

document
  .querySelector(".skip-link")
  .addEventListener("click", function (event) {
    event.preventDefault();

    this.blur();

    const main = document.getElementById("mainContent");

    main.focus();

    main.scrollIntoView();
  });
