// ContextMenu.js
import React from 'react';

const ContextMenu = ({ x, y, onClose, options }) => {
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: y,
          left: x,
          zIndex: 1000,
          backgroundColor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          padding: '4px 0',
          minWidth: '150px'
        }}
        className="context-menu"
      >
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => {
              option.onClick();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              color: option.type === 'delete' ? '#dc2626' : 'inherit',
              direction: 'rtl'
            }}
            className="context-menu-item"
            onMouseEnter={e => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
          >
            {option.label}
          </div>
        ))}
      </div>
    </>
  );
};

export default ContextMenu;