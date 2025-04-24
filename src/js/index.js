// src/js/index.js

// Import CSS utama (Webpack akan menanganinya)
import '../styles/main.css';

// Import Router dan inisialisasi
import initRouter from './router/router.js';

// Import komponen lain jika perlu diinisialisasi global (biasanya tidak)
// import SomeGlobalComponent from './components/some-global-component.js';

// Inisialisasi Router ketika DOM siap
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application Start');
    initRouter();

    // Inisialisasi komponen global lain jika ada
    // SomeGlobalComponent.init();
});