// src/js/view/components/loading-indicator.js
// Ini bisa berupa fungsi yang mengembalikan HTML string atau elemen
const createLoadingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="spinner"></div>
        <span>Loading...</span>
    `;
    return indicator;
};

// Atau hanya class CSS yang di-toggle
// .loading-indicator { display: flex; ... }
// .loading-indicator .spinner { border: 4px solid rgba(0,0,0,.1); ... animation: spin 1s linear infinite; }
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

export default createLoadingIndicator; // Jika mengembalikan elemen