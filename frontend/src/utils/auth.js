// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('accessToken') !== null;
};

// Get current user ID from token (simplified)
export const getUserId = () => {
  // In a real app, you would decode the JWT to get the user ID
  // For simplicity, we'll assume the user ID is stored in a cookie
  return localStorage.getItem('userId');
};

// Set tokens in local storage
export const setAuthTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Remove tokens from local storage
export const removeAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Get access token
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};