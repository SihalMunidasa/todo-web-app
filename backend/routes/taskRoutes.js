import express from 'express';
import {
  getAllTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTodaysTasks
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { validateTask } from '../middleware/validation.js';

const router = express.Router();

// Protect all task routes
router.use(protect);

// Task routes
router.route('/')
  .get(getAllTasks)
  .post(validateTask, createTask);

router.route('/today')
  .get(getTodaysTasks);

router.route('/:id')
  .get(getTask)
  .patch(validateTask, updateTask)
  .delete(deleteTask);

export default router;