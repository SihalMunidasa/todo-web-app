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

const initialState = {
  tasks: [],
  todayTasks: [],
  currentTask: null,
  loading: false,
  error: null
};

export const taskReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_TASKS_REQUEST:
    case GET_TASK_REQUEST:
    case CREATE_TASK_REQUEST:
    case UPDATE_TASK_REQUEST:
    case DELETE_TASK_REQUEST:
    case GET_TODAYS_TASKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case GET_TASKS_SUCCESS:
      return {
        ...state,
        loading: false,
        tasks: action.payload
      };
      
    case GET_TODAYS_TASKS_SUCCESS:
      return {
        ...state,
        loading: false,
        todayTasks: action.payload
      };
      
    case GET_TASK_SUCCESS:
      return {
        ...state,
        loading: false,
        currentTask: action.payload
      };
      
    case CREATE_TASK_SUCCESS:
      return {
        ...state,
        loading: false,
        tasks: [...state.tasks, action.payload],
        todayTasks: isToday(new Date(action.payload.dueDate)) 
          ? [...state.todayTasks, action.payload] 
          : state.todayTasks
      };
      
    case UPDATE_TASK_SUCCESS:
      return {
        ...state,
        loading: false,
        tasks: state.tasks.map(task => 
          task._id === action.payload._id ? action.payload : task
        ),
        todayTasks: state.todayTasks.map(task => 
          task._id === action.payload._id ? action.payload : task
        ),
        currentTask: action.payload
      };
      
    case DELETE_TASK_SUCCESS:
      return {
        ...state,
        loading: false,
        tasks: state.tasks.filter(task => task._id !== action.payload),
        todayTasks: state.todayTasks.filter(task => task._id !== action.payload),
        currentTask: null
      };
      
    case GET_TASKS_FAILURE:
    case GET_TASK_FAILURE:
    case CREATE_TASK_FAILURE:
    case UPDATE_TASK_FAILURE:
    case DELETE_TASK_FAILURE:
    case GET_TODAYS_TASKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case CLEAR_TASK_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

// Helper function to check if a date is today
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}