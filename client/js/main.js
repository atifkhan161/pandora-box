import { config } from './config.js';

console.log('Pandora Box PWA is running!');
console.log('API Base URL:', config.apiBaseUrl);

document.addEventListener('DOMContentLoaded', () => {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        appDiv.innerHTML = `
            <h2>Frontend Loaded!</h2>
            <p>Environment: ${config.environment}</p>
            <p>API URL: ${config.apiBaseUrl}</p>
        `;
    }
});