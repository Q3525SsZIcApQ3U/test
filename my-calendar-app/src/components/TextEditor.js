// src/components/TextEditor.js
import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import fileAccessService from '../services/fileAccessService';

// Import highlight.js directly and register it globally
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // Light theme
import 'highlight.js/styles/github-dark.css'; // Dark theme

// Make sure highlight.js is available globally for Quill
window.hljs = hljs;

// Constants
const AUTO_SAVE_DELAY = 1000; // ms
const STORAGE_KEY = 'lastSavedEditorFile';

const TextEditor = ({ isDarkMode }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [fileName, setFileName] = useState('editor-content.html');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Check if highlight.js is available globally
    if (!window.hljs) {
      console.warn('highlight.js not available globally, syntax highlighting may not work');
      window.hljs = hljs; // Try setting it again
    }

    // Try initializing Quill, but with fallback if syntax highlighting fails
    try {
      quillRef.current = new Quill(editorRef.current, {
        modules: {
          syntax: true, // Enable syntax highlighting
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ]
        },
        theme: 'snow',
        placeholder: 'כתוב כאן...'
      });
    } catch (error) {
      console.error('Error initializing Quill with syntax:', error);
      // Fallback to Quill without syntax highlighting
      quillRef.current = new Quill(editorRef.current, {
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote'], // No code-block without syntax
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ]
        },
        theme: 'snow',
        placeholder: 'כתוב כאן...'
      });
    }

    // Set default direction to RTL for Hebrew
    quillRef.current.format('direction', 'rtl');
    quillRef.current.format('align', 'right');

    // Load saved content immediately after initialization
    loadFromFile();

    // Set up change handler
    quillRef.current.on('text-change', handleContentChange);

    // Cleanup
    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change', handleContentChange);
      }
    };
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (editorRef.current) {
      const toolbarElement = editorRef.current.previousSibling;
      if (isDarkMode) {
        editorRef.current.classList.add('dark-theme');
        if (toolbarElement) toolbarElement.classList.add('dark-theme');
      } else {
        editorRef.current.classList.remove('dark-theme');
        if (toolbarElement) toolbarElement.classList.remove('dark-theme');
      }
    }
  }, [isDarkMode]);

  // Handle content changes with debounce
  const handleContentChange = () => {
    if (!quillRef.current) return;
    
    const editorContent = quillRef.current.root.innerHTML;
    setContent(editorContent);
    
    // Skip auto-save during initial load
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    // Auto-save with debounce
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
      saveToFile(editorContent);
    }, AUTO_SAVE_DELAY);
  };

  // Load content from file
  const loadFromFile = () => {
    // First try to prompt for file selection
    fileAccessService.loadFromFile((loadedContent) => {
      if (quillRef.current) {
        quillRef.current.root.innerHTML = loadedContent;
        setContent(loadedContent);
        setLastSaved(new Date());
        setIsInitialLoad(false);
      }
    });
  };

  // Save content to file
  const saveToFile = (contentToSave = null) => {
    if (!contentToSave && quillRef.current) {
      contentToSave = quillRef.current.root.innerHTML;
    }
    
    if (!contentToSave) return;
    
    setIsSaving(true);
    
    try {
      // Save to file as HTML
      fileAccessService.saveToFile(contentToSave, fileName);
      
      // Update last saved time
      const now = new Date();
      setLastSaved(now);
      
      // Remember the last saved timestamp
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file name change
  const handleFileNameChange = (e) => {
    let newName = e.target.value;
    
    // Ensure it has .html extension
    if (!newName.endsWith('.html')) {
      newName += '.html';
    }
    
    setFileName(newName);
  };

  return (
    <div className="text-editor-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Status indicator and buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: '10px 15px',
        borderBottom: `1px solid ${isDarkMode ? '#4a5568' : '#eee'}`
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '10px'
        }}>
          <div>
            {isSaving ? (
              <span style={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>שומר...</span>
            ) : lastSaved ? (
              <span style={{ color: isDarkMode ? '#68d391' : '#48bb78' }}>
                נשמר לאחרונה: {new Intl.DateTimeFormat('he-IL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }).format(lastSaved)}
              </span>
            ) : null}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={loadFromFile} 
              style={{
                padding: '5px 10px',
                background: isDarkMode ? '#4a5568' : '#e2e8f0',
                color: isDarkMode ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              טען מקובץ
            </button>
            
            <button 
              onClick={() => saveToFile()} 
              style={{
                padding: '5px 10px',
                background: isDarkMode ? '#6366f1' : '#4338ca',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              שמור HTML
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.9rem' }}>
            שם הקובץ:
          </label>
          <input
            type="text"
            value={fileName}
            onChange={handleFileNameChange}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
              background: isDarkMode ? '#2d3748' : 'white',
              color: isDarkMode ? '#e2e8f0' : 'inherit',
              width: '200px'
            }}
          />
        </div>
      </div>
      
      {/* Quill editor */}
      <div 
        ref={editorRef} 
        style={{ 
          flex: 1,
          backgroundColor: isDarkMode ? '#2d3748' : 'white',
          color: isDarkMode ? '#e2e8f0' : 'inherit'
        }}
      />
    </div>
  );
};

export default TextEditor;
