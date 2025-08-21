const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const config = {
    environment: isDevelopment ? 'development' : 'production',
    apiBaseUrl: isDevelopment ? 'http://localhost:3000/api/v1' : 'https://api.yourproductiondomain.com/api/v1',
};