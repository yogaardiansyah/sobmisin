// src/js/utils/dom.js
const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => parent.querySelectorAll(selector);

export { qs, qsa };