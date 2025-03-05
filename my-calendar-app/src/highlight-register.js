// src/highlight-register.js
import hljs from 'highlight.js';
import 'highlight.js/lib/languages/javascript';
import 'highlight.js/lib/languages/python';
import 'highlight.js/lib/languages/css';
import 'highlight.js/lib/languages/xml';
import 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/atom-one-light.css';
import 'highlight.js/styles/atom-one-dark.css';

// Register hljs globally for Quill
window.hljs = hljs;

export default hljs;
