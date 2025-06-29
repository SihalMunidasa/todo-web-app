import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Validate that due date is not in the past
          return !value || value >= new Date().setHours(0, 0, 0, 0);
        },
        message: 'Due date cannot be in the past',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'completed'],
        message: 'Invalid task status',
      },
      default: 'pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Invalid priority level',
      },
      default: 'medium',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    completedAt: {
      type: Date,
      validate: {
        validator: function(value) {
          // Validate that completed date is not in the future
          return !value || value <= new Date();
        },
        message: 'Completed date cannot be in the future',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual Property: Check if task is overdue
 * @returns {boolean} True if task is overdue
 */
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return this.dueDate < new Date();
});

/**
 * Virtual Property: Check if task is due today
 * @returns {boolean} True if task is due today
 */
taskSchema.virtual('isDueToday').get(function() {
  if (!this.dueDate) return false;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  );
});

/**
 * Middleware: Handle completion timestamp
 */
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.completedAt) {
      this.completedAt = undefined;
    }
  }
  next();
});

/**
 * Query Middleware: Automatically populate user data
 */
taskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email',
  });
  next();
});

// Indexes for optimized querying
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ isOverdue: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;