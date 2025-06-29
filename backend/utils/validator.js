import validator from 'validator';

/**
 * Validate user registration data
 * @param {Object} data - { name, email, password }
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateRegister = (data) => {
  const errors = {};
  
  if (!data.name || !validator.isLength(data.name, { min: 2, max: 50 })) {
    errors.name = 'Name must be between 2 and 50 characters';
  }
  
  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.password || !validator.isStrongPassword(data.password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    errors.password = 'Password must be at least 8 characters with lowercase, uppercase, number, and symbol';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login data
 * @param {Object} data - { email, password }
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateLogin = (data) => {
  const errors = {};
  
  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate task data
 * @param {Object} data - { title, description, dueDate }
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateTask = (data) => {
  const errors = {};
  
  if (!data.title || !validator.isLength(data.title, { min: 1, max: 100 })) {
    errors.title = 'Title must be between 1 and 100 characters';
  }
  
  if (data.description && !validator.isLength(data.description, { max: 500 })) {
    errors.description = 'Description cannot exceed 500 characters';
  }
  
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      errors.dueDate = 'Due date cannot be in the past';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate password reset data
 * @param {Object} data - { password }
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validatePassword = (data) => {
  const errors = {};
  
  if (!data.password || !validator.isStrongPassword(data.password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    errors.password = 'Password must be at least 8 characters with lowercase, uppercase, number, and symbol';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input data
 * @param {Object} data - Input data
 * @returns {Object} Sanitized data
 */
export const sanitizeInput = (data) => {
  const sanitized = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = validator.escape(validator.trim(value));
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};