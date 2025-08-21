import { PandoraBoxApp } from '../js/app.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = window.app || new PandoraBoxApp(); // Use existing app instance or create new

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('login-error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = ''; // Clear previous errors

            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const success = await app.handleLogin(username, password); // Assuming handleLogin takes username and password
                if (success) {
                    // Redirect or show dashboard, app.js will handle this
                } else {
                    errorMessage.textContent = 'Invalid username or password.';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = 'An error occurred during login. Please try again.';
            }
        });
    }
});