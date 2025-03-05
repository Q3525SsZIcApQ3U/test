// src/services/fileAccessService.js

/**
 * Service for handling file operations in the browser
 */
const fileAccessService = {
  /**
   * Save HTML content to a text file
   * @param {string} htmlContent - The HTML content to save
   * @param {string} fileName - Optional file name (default: editor-content.html)
   * @returns {boolean} Success status
   */
  saveToFile: (htmlContent, fileName = 'editor-content.html') => {
    try {
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      
      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error saving to file:', error);
      return false;
    }
  },

  /**
   * Open a file picker and load the content
   * @param {Function} onContentLoaded - Callback for when content is loaded
   * @param {string} accept - MIME types to accept (default: text/html,text/plain)
   */
  loadFromFile: (onContentLoaded, accept = 'text/html,text/plain') => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle file selection
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        document.body.removeChild(fileInput);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target.result;
        onContentLoaded(content);
        document.body.removeChild(fileInput);
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        document.body.removeChild(fileInput);
      };
      
      reader.readAsText(file);
    };
    
    // Trigger the file picker
    fileInput.click();
  }
};

export default fileAccessService;
