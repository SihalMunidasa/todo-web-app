import Task from '../models/Task.js';
import { AppError, globalErrorHandler } from '../utils/error.js';
import CacheService from '../utils/cache.js';

/**
 * Get all tasks for the authenticated user
 */
export const getAllTasks = async (req, res, next) => {
  try {
    // Get sorting parameter from query string
    const sortBy = req.query.sort || 'dueDate';
    
    // Build sort object
    let sortOption = {};
    if (sortBy === 'createdAt') {
      sortOption = { createdAt: -1 };
    } else if (sortBy === 'priority') {
      sortOption = { priority: -1, dueDate: 1 };
    } else {
      sortOption = { dueDate: 1 };
    }
    
    // Cache key
    const cacheKey = `tasks:${req.user.id}:${sortBy}`;
    
    // Check cache
    const cachedTasks = await CacheService.get(cacheKey);
    if (cachedTasks) {
      return res.status(200).json({
        status: 'success',
        fromCache: true,
        results: cachedTasks.length,
        data: cachedTasks,
      });
    }
    
    // Find tasks for current user
    const tasks = await Task.find({ user: req.user.id })
      .sort(sortOption);
    
    // Cache for 5 minutes
    await CacheService.set(cacheKey, tasks, 300);
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res, next) => {
  try {
    // Add user ID to request body
    req.body.user = req.user.id;
    
    const task = await Task.create(req.body);
    
    // Clear cache for this user's tasks
    await CacheService.clearPattern(`tasks:${req.user.id}:*`);
    
    res.status(201).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task
 */
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!task) {
      return next(new AppError('No task found with that ID', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a task
 */
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return next(new AppError('No task found with that ID', 404));
    }
    
    // Clear cache for this user's tasks
    await CacheService.clearPattern(`tasks:${req.user.id}:*`);
    
    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!task) {
      return next(new AppError('No task found with that ID', 404));
    }
    
    // Clear cache for this user's tasks
    await CacheService.clearPattern(`tasks:${req.user.id}:*`);
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's tasks
 */
export const getTodaysTasks = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const tasks = await Task.find({
      user: req.user.id,
      dueDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ dueDate: 1 });
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};