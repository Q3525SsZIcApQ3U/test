// TagsManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

const TagsManager = ({ onTagsChange, courses, onCoursesChange }) => {
  const [tags, setTags] = useState(() => {
    const savedTags = localStorage.getItem('courseTags');
    return savedTags ? JSON.parse(savedTags) : [];
  });
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4361ee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagForEdit, setSelectedTagForEdit] = useState(null);
  const [bulkTagInput, setBulkTagInput] = useState('');
  
  // Save tags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('courseTags', JSON.stringify(tags));
    
    // Notify parent component if callback is provided
    if (onTagsChange) {
      onTagsChange(tags);
    }
  }, [tags, onTagsChange]);
  
  const handleAddTag = () => {
    if (newTagName.trim() && !tags.some(tag => tag.name === newTagName.trim())) {
      const newTag = {
        id: `tag-${Date.now()}`,
        name: newTagName.trim(),
        color: newTagColor
      };
      
      setTags([...tags, newTag]);
      setNewTagName('');
      setNewTagColor('#4361ee');
    }
  };
  
  const handleBulkAddTags = () => {
    if (bulkTagInput.trim()) {
      // Split by commas or newlines
      const tagNames = bulkTagInput
        .split(/[,\n]/)
        .map(t => t.trim())
        .filter(t => t && !tags.some(existingTag => existingTag.name === t));
      
      const newTags = tagNames.map(name => ({
        id: `tag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        color: getRandomColor()
      }));
      
      if (newTags.length > 0) {
        setTags([...tags, ...newTags]);
        setBulkTagInput('');
      }
    }
  };
  
  const getRandomColor = () => {
    const colors = [
      '#4361ee', '#3a0ca3', '#7209b7', '#f72585', 
      '#4cc9f0', '#4895ef', '#560bad', '#f3722c', 
      '#f8961e', '#f9c74f', '#90be6d', '#43aa8b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const handleDeleteTag = (tagId) => {
    // First remove from all courses
    if (courses && courses.length > 0) {
      const updatedCourses = courses.map(course => {
        if (course.tags && course.tags.some(tag => tag.id === tagId)) {
          return {
            ...course,
            tags: course.tags.filter(tag => tag.id !== tagId)
          };
        }
        return course;
      });
      
      // Save updated courses to localStorage
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      
      // Notify parent component if callback is provided
      if (onCoursesChange) {
        onCoursesChange(updatedCourses);
      }
    }
    
    // Then remove the tag itself
    setTags(tags.filter(tag => tag.id !== tagId));
  };
  
  const handleEditTag = (tag) => {
    setSelectedTagForEdit(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color || '#4361ee');
  };
  
  const handleUpdateTag = () => {
    if (selectedTagForEdit && newTagName.trim()) {
      const updatedTags = tags.map(tag => 
        tag.id === selectedTagForEdit.id 
          ? { ...tag, name: newTagName.trim(), color: newTagColor } 
          : tag
      );
      
      setTags(updatedTags);
      
      // Also update this tag in all courses
      if (courses && courses.length > 0) {
        const updatedCourses = courses.map(course => {
          if (course.tags && course.tags.some(tag => tag.id === selectedTagForEdit.id)) {
            return {
              ...course,
              tags: course.tags.map(tag => 
                tag.id === selectedTagForEdit.id 
                  ? { ...tag, name: newTagName.trim(), color: newTagColor } 
                  : tag
              )
            };
          }
          return course;
        });
        
        // Save updated courses to localStorage
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        
        // Notify parent component if callback is provided
        if (onCoursesChange) {
          onCoursesChange(updatedCourses);
        }
      }
      
      // Reset edit state
      setSelectedTagForEdit(null);
      setNewTagName('');
      setNewTagColor('#4361ee');
    }
  };
  
  const handleCancelEdit = () => {
    setSelectedTagForEdit(null);
    setNewTagName('');
    setNewTagColor('#4361ee');
  };
  
  // Filter tags by search term
const filteredTags = tags.filter(tag => {
  // Check if tag and tag.name exist
  if (!tag || !tag.name || typeof tag.name !== 'string') return false;
  
  // Check if searchTerm exists
  if (!searchTerm || typeof searchTerm !== 'string') return false;
  
  // Use includes for Hebrew text (toLowerCase might not be necessary for Hebrew)
  return tag.name.includes(searchTerm);
  
  // If you still want to use case-insensitive matching:
  // return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
});
  
  // Count courses using each tag
  const getTagUsageCount = (tagId) => {
    if (!courses || courses.length === 0) return 0;
    
    return courses.filter(course => 
      course.tags && course.tags.some(tag => tag.id === tagId)
    ).length;
  };
  
  return (
    <div className="tags-manager">
      <h3>ניהול תגיות</h3>
      
      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          placeholder="חפש תגיות..."
        />
      </div>
      
      {/* Tags list */}
      <div className="tags-grid">
        {filteredTags.map(tag => (
          <div 
            key={tag.id} 
            className="tag-item"
            style={{ 
              backgroundColor: tag.color || '#4361ee',
              color: '#ffffff'
            }}
          >
            <span className="tag-name">{tag.name}</span>
            <span className="tag-count">{getTagUsageCount(tag.id)}</span>
            <div className="tag-actions">
              <button 
                type="button" 
                className="tag-edit-btn"
                onClick={() => handleEditTag(tag)}
                title="ערוך תגית"
              >
                ✏️
              </button>
              <button 
                type="button" 
                className="tag-delete-btn"
                onClick={() => handleDeleteTag(tag.id)}
                title="מחק תגית"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* No tags message */}
      {filteredTags.length === 0 && (
        <div className="no-items">
          {searchTerm 
            ? `לא נמצאו תגיות עבור "${searchTerm}"`
            : 'אין תגיות. הוסף תגיות חדשות למטה.'}
        </div>
      )}
      
      {/* Add/Edit tag form */}
      <div className="tag-form">
        <h4>{selectedTagForEdit ? 'ערוך תגית' : 'הוסף תגית חדשה'}</h4>
        
        <div className="form-group">
          <label>שם התגית</label>
          <input 
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="form-input"
            placeholder="שם התגית"
          />
        </div>
        
        <div className="form-group">
          <label>צבע התגית</label>
          <div className="color-input-group">
            <input 
              type="color" 
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="color-picker"
            />
            <input 
              type="text"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="form-input"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
        
        <div className="preview-tag" style={{ 
          backgroundColor: newTagColor,
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '16px',
          display: 'inline-block',
          marginTop: '12px',
          marginBottom: '16px',
          fontWeight: 'bold'
        }}>
          {newTagName || 'תצוגה מקדימה'}
        </div>
        
        <div className="button-group">
          {selectedTagForEdit ? (
            <>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleUpdateTag}
              >
                עדכן תגית
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                ביטול
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleAddTag}
            >
              הוסף תגית
            </button>
          )}
        </div>
      </div>
      
      {/* Bulk add tags */}
      {!selectedTagForEdit && (
        <div className="bulk-add-tags">
          <h4>הוספת תגיות מרובות</h4>
          <div className="form-group">
            <label>הכנס תגיות מופרדות בפסיקים או שורות חדשות</label>
            <textarea
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              className="form-input"
              rows="4"
              placeholder="תגית 1, תגית 2, תגית 3"
            />
          </div>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleBulkAddTags}
          >
            הוסף תגיות
          </button>
        </div>
      )}
    </div>
  );
};

export default TagsManager;
