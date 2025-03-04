import React, { useState, useEffect } from 'react';

const TodoComponent = ({ isDarkMode }) => {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  // Save todos to localStorage when they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      setTodos([todo, ...todos]); // Add new todo at the beginning
      setNewTodo('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const handleToggleTodo = (id) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // Filter todos based on the selected filter
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true; // 'all' filter
  });

  // Count active and completed todos
  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const completedTodosCount = todos.filter(todo => todo.completed).length;

  return (
    <div className={`todo-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="todo-header">
        <h2 className="todo-title">רשימת משימות</h2>
        
        <div className="todo-filters header-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
             הכל
            <span className="filter-count">{todos.length}</span>
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
             פעילות
            <span className="filter-count">{activeTodosCount}</span>
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
             הושלמו
            <span className="filter-count">{completedTodosCount}</span>
          </button>
          {completedTodosCount > 0 && (
            <button 
              className="clear-completed-btn filter-btn"
              onClick={handleClearCompleted}
            >
              נקה הושלמו
            </button>
          )}
        </div>
      </div>
      
      <div className="todo-input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          className="todo-input"
          placeholder="הוסף משימה חדשה..."
          dir="rtl"
        />
        <button 
          onClick={handleAddTodo}
          className="add-todo-btn"
        >
          הוסף
        </button>
      </div>
      
      <div className="todo-list">
        {filteredTodos.length > 0 ? (
          filteredTodos.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-checkbox-container">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="todo-checkbox"
                  id={`todo-${todo.id}`}
                />
                <label 
                  htmlFor={`todo-${todo.id}`} 
                  className="todo-checkbox-label"
                ></label>
              </div>
              <span className={`todo-text ${todo.completed ? 'completed' : ''}`} dir="rtl">
                {todo.text}
              </span>
              <div className="todo-actions">
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="todo-delete"
                  aria-label="מחק משימה"
                  title="מחק משימה"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-todos">
            <p>
              {filter === 'all' 
                ? 'אין משימות. הוסף משימה חדשה למעלה.' 
                : filter === 'active' 
                  ? 'אין משימות פעילות.' 
                  : 'אין משימות שהושלמו.'}
            </p>
          </div>
        )}
      </div>
      
      {todos.length > 0 && (
        <div className="todo-footer">
          <div className="todo-summary">
            {activeTodosCount > 0 ? (
              <span>נותרו <strong>{activeTodosCount}</strong> משימות לביצוע</span>
            ) : (
              <span>כל המשימות הושלמו 🎉</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoComponent;
