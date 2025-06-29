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

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
    case REGISTER_REQUEST:
    case FORGOT_PASSWORD_REQUEST:
    case RESET_PASSWORD_REQUEST:
    case CHANGE_PASSWORD_REQUEST:
    case VERIFY_EMAIL_REQUEST:
    case LOAD_USER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
      
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
    case RESET_PASSWORD_SUCCESS:
    case VERIFY_EMAIL_SUCCESS:
    case LOAD_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload
      };
      
    case FORGOT_PASSWORD_SUCCESS:
    case CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload
      };
      
    case LOGOUT_SUCCESS:
      return {
        ...initialState
      };
      
    case LOGIN_FAILURE:
    case REGISTER_FAILURE:
    case FORGOT_PASSWORD_FAILURE:
    case RESET_PASSWORD_FAILURE:
    case CHANGE_PASSWORD_FAILURE:
    case VERIFY_EMAIL_FAILURE:
    case LOAD_USER_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
      
    case LOGOUT_FAILURE:
      return {
        ...state,
        error: action.payload
      };
      
    case CLEAR_AUTH_ERROR:
      return {
        ...state,
        error: null
      };
      
    case CLEAR_AUTH_MESSAGE:
      return {
        ...state,
        message: null
      };
      
    default:
      return state;
  }
};