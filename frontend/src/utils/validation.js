export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export const validateTask = (task) => {
  const errors = {};
  
  if (!task.title || task.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (task.title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }
  
  if (task.description && task.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }
  
  if (task.dueDate && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)) {
    errors.dueDate = 'Due date cannot be in the past';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};