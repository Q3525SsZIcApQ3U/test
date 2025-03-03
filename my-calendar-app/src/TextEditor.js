import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Import highlight.js and the desired style
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Import KaTeX if needed for formulas
import 'katex/dist/katex.min.css';

const API_BASE_URL = 'http://localhost:5001/api';

const TextEditor = () => {
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const [editorContent, setEditorContent] = useState('');

  // Initialize Quill and load content from the file
  useEffect(() => {
    // This is the critical part - register hljs globally BEFORE importing the syntax module
    window.hljs = hljs;

    // Import Quill's syntax module dynamically after hljs is registered
    const initQuill = async () => {
      try {
        // Import Quill's syntax module
        await import('quill/dist/quill.js');
        
        // Only initialize Quill if it hasn't been initialized yet and the editor ref exists
        if (editorRef.current && !quillInstanceRef.current) {
          quillInstanceRef.current = new Quill(editorRef.current, {
            modules: {
              syntax: true,
              toolbar: '#toolbar-container',
            },
            placeholder: 'Compose an epic...',
            theme: 'snow',
          });

          // Load the saved content from the backend after Quill is initialized
          await loadContent();
        }
      } catch (error) {
        console.error('Error initializing Quill:', error);
      }
    };

    initQuill();

    // Cleanup function
    return () => {
      quillInstanceRef.current = null;
    };
  }, []);

  // Load content from the backend when the component mounts
  const loadContent = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/text-editor`);
      setEditorContent(response.data.content || '');
      if (quillInstanceRef.current) {
        quillInstanceRef.current.root.innerHTML = response.data.content || '';
      }
    } catch (err) {
      console.error('Error fetching editor content:', err);
    }
  };

  // Save content to the backend whenever the editor's content changes
  const handleEditorChange = async () => {
    if (quillInstanceRef.current) {
      const content = quillInstanceRef.current.root.innerHTML;
      console.log(content)
      setEditorContent(content);

      try {
        await axios.post(`${API_BASE_URL}/text-editor`, { content });
      } catch (err) {
        console.error('Error saving editor content:', err);
      }
    }
  };

  // Attach the handleEditorChange to Quill's 'text-change' event
  useEffect(() => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.on('text-change', handleEditorChange);
    }
  }, [quillInstanceRef.current]);

  return (
    <div className="editor-container">
      <div id="toolbar-container">
        <span className="ql-formats">
          <select className="ql-font"></select>
          <select className="ql-size"></select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <button className="ql-strike"></button>
        </span>
        <span className="ql-formats">
          <select className="ql-color"></select>
          <select className="ql-background"></select>
        </span>
        <span className="ql-formats">
          <button className="ql-script" value="sub"></button>
          <button className="ql-script" value="super"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-header" value="1"></button>
          <button className="ql-header" value="2"></button>
          <button className="ql-blockquote"></button>
          <button className="ql-code-block"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-indent" value="-1"></button>
          <button className="ql-indent" value="+1"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-direction" value="rtl"></button>
          <select className="ql-align"></select>
        </span>
        <span className="ql-formats">
          <button className="ql-link"></button>
          <button className="ql-image"></button>
          <button className="ql-video"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-clean"></button>
        </span>
      </div>
      <div
        id="editor"
        ref={editorRef}
        style={{
          minHeight: '300px',  // Set minimum height for the editor
          maxHeight: '500px',  // Set a maximum height for the editor
          overflowY: 'auto',   // Enable vertical scrolling
        }}
      ></div>
    </div>
  );
};

export default TextEditor;
