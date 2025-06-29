import axios from 'axios';
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGOUT_REQUEST,
  LOGOUT_SUCCESS,
  LOGOUT_FAILURE,
  FORGOT_PASSWORD_REQUEST,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAILURE,
  RESET_PASSWORD_REQUEST,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_FAILURE,
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
  VERIFY_EMAIL_REQUEST,
  VERIFY_EMAIL_SUCCESS,
  VERIFY_EMAIL_FAILURE,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAILURE,
  CLEAR_AUTH_ERROR,
  CLEAR_AUTH_MESSAGE
} from '../constants/authConstants';
import { API_BASE } from '../../utils/api';

// Login user
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/auth/login`,
      { email, password },
      config
    );

    // Set tokens in local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: LOGIN_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Register user
export const register = (name, email, password) => async (dispatch) => {
  try {
    dispatch({ type: REGISTER_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/auth/register`,
      { name, email, password },
      config
    );

    // Set tokens in local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: REGISTER_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Logout user
export const logout = () => async (dispatch) => {
  try {
    dispatch({ type: LOGOUT_REQUEST });

    await axios.get(`${API_BASE}/auth/logout`);

    // Remove tokens from local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    dispatch({ type: LOGOUT_SUCCESS });
  } catch (error) {
    dispatch({
      type: LOGOUT_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Forgot password
export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch({ type: FORGOT_PASSWORD_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/auth/forgot-password`,
      { email },
      config
    );

    dispatch({
      type: FORGOT_PASSWORD_SUCCESS,
      payload: data.message
    });
  } catch (error) {
    dispatch({
      type: FORGOT_PASSWORD_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Reset password
export const resetPassword = (token, password) => async (dispatch) => {
  try {
    dispatch({ type: RESET_PASSWORD_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/auth/reset-password?token=${token}`,
      { password },
      config
    );

    // Set tokens in local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    dispatch({
      type: RESET_PASSWORD_SUCCESS,
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: RESET_PASSWORD_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Change password
export const changePassword = (currentPassword, newPassword) => async (dispatch, getState) => {
  try {
    dispatch({ type: CHANGE_PASSWORD_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/auth/change-password`,
      { currentPassword, newPassword },
      config
    );

    // Update tokens in local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    dispatch({
      type: CHANGE_PASSWORD_SUCCESS,
      payload: data.message
    });
  } catch (error) {
    dispatch({
      type: CHANGE_PASSWORD_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Verify email
export const verifyEmail = (token) => async (dispatch) => {
  try {
    dispatch({ type: VERIFY_EMAIL_REQUEST });

    const { data } = await axios.get(
      `${API_BASE}/auth/verify-email?token=${token}`
    );

    // Set tokens in local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    dispatch({
      type: VERIFY_EMAIL_SUCCESS,
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: VERIFY_EMAIL_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Load user data
export const loadUser = () => async (dispatch) => {
  try {
    dispatch({ type: LOAD_USER_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.get(
      `${API_BASE}/auth/me`,
      config
    );

    dispatch({
      type: LOAD_USER_SUCCESS,
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: LOAD_USER_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Clear auth error
export const clearAuthError = () => (dispatch) => {
  dispatch({ type: CLEAR_AUTH_ERROR });
};

// Clear auth message
export const clearAuthMessage = () => (dispatch) => {
  dispatch({ type: CLEAR_AUTH_MESSAGE });
};