// src/services/storageService.js

const STORAGE_KEY = 'editorContent';

/**
 * Service for managing editor content storage
 */
const storageService = {
  /**
   * Save content to local storage
   * @param {string} content - The content to save
   */
  saveContent: (content) => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
      localStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString());
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  /**
   * Load content from local storage
   * @returns {string|null} The saved content or null if nothing is saved
   */
  loadContent: () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },

  /**
   * Get last saved timestamp
   * @returns {Date|null} The timestamp or null if no timestamp exists
   */
  getLastSavedTime: () => {
    try {
      const timestamp = localStorage.getItem(`${STORAGE_KEY}_timestamp`);
      return timestamp ? new Date(parseInt(timestamp, 10)) : null;
    } catch (error) {
      console.error('Error getting timestamp:', error);
      return null;
    }
  },

  /**
   * Save content to text file
   * @param {string} htmlContent - The HTML content to convert and save
   */
  saveToTextFile: (htmlContent) => {
    try {
      // Simple HTML to text conversion (remove HTML tags)
      const textContent = htmlContent.replace(/<[^>]*>/g, '');
      
      // Create a blob with the content
      const blob = new Blob([textContent], { type: 'text/plain' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'editor-content.txt';
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error saving to text file:', error);
      return false;
    }
  }
};

export default storageService;
