import { config } from '../config.js';

export async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(`${config.apiBaseUrl}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error; // Re-throw to allow calling code to handle
    }
}