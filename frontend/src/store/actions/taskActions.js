import axios from 'axios';
import {
  GET_TASKS_REQUEST,
  GET_TASKS_SUCCESS,
  GET_TASKS_FAILURE,
  GET_TASK_REQUEST,
  GET_TASK_SUCCESS,
  GET_TASK_FAILURE,
  CREATE_TASK_REQUEST,
  CREATE_TASK_SUCCESS,
  CREATE_TASK_FAILURE,
  UPDATE_TASK_REQUEST,
  UPDATE_TASK_SUCCESS,
  UPDATE_TASK_FAILURE,
  DELETE_TASK_REQUEST,
  DELETE_TASK_SUCCESS,
  DELETE_TASK_FAILURE,
  GET_TODAYS_TASKS_REQUEST,
  GET_TODAYS_TASKS_SUCCESS,
  GET_TODAYS_TASKS_FAILURE,
  CLEAR_TASK_ERROR
} from '../constants/taskConstants';
import { API_BASE } from '../../utils/api';

// Get all tasks
export const getTasks = (sortBy = 'dueDate') => async (dispatch) => {
  try {
    dispatch({ type: GET_TASKS_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.get(
      `${API_BASE}/tasks?sort=${sortBy}`,
      config
    );

    dispatch({
      type: GET_TASKS_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: GET_TASKS_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Get today's tasks
export const getTodayTasks = () => async (dispatch) => {
  try {
    dispatch({ type: GET_TODAYS_TASKS_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.get(
      `${API_BASE}/tasks/today`,
      config
    );

    dispatch({
      type: GET_TODAYS_TASKS_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: GET_TODAYS_TASKS_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Get task by ID
export const getTaskDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: GET_TASK_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.get(
      `${API_BASE}/tasks/${id}`,
      config
    );

    dispatch({
      type: GET_TASK_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: GET_TASK_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Create task
export const createTask = (taskData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_TASK_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.post(
      `${API_BASE}/tasks`,
      taskData,
      config
    );

    dispatch({
      type: CREATE_TASK_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: CREATE_TASK_FAILURE,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

// Update task
export const updateTask = (id, taskData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_TASK_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    const { data } = await axios.patch(
      `${API_BASE}/tasks/${id}`,
      taskData,
      config
    );

    dispatch({
      type: UPDATE_TASK_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: UPDATE_TASK_FAILURE,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

// Delete task
export const deleteTask = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_TASK_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    };

    await axios.delete(
      `${API_BASE}/tasks/${id}`,
      config
    );

    dispatch({
      type: DELETE_TASK_SUCCESS,
      payload: id
    });
  } catch (error) {
    dispatch({
      type: DELETE_TASK_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

// Clear task error
export const clearTaskError = () => (dispatch) => {
  dispatch({ type: CLEAR_TASK_ERROR });
};