const createLoadingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="spinner"></div>
        <span>Loading...</span>
    `;
    return indicator;
};


export default createLoadingIndicator;