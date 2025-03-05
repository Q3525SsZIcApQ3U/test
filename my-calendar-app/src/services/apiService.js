// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Service for communicating with the backend API
 */
const apiService = {
  /**
   * Save content to the server
   * @param {string} content - HTML content to save
   * @returns {Promise} Promise that resolves with the response
   */
  saveContent: async (content) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/file-content`, { content });
      return response.data;
    } catch (error) {
      console.error('Error saving content to server:', error);
      throw error;
    }
  },

  /**
   * Load content from the server
   * @returns {Promise} Promise that resolves with the content
   */
  loadContent: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/file-content`);
      return response.data;
    } catch (error) {
      console.error('Error loading content from server:', error);
      throw error;
    }
  }
};

export default apiService;
