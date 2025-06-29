import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { redisClient } from '../config/db.js';

describe('Task API', () => {
  let testUser, accessToken;
  const userData = {
    name: 'Task User',
    email: 'taskuser@example.com',
    password: 'Password123!'
  };
  
  const taskData = {
    title: 'Test Task',
    description: 'This is a test task',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  };

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      ...userData,
      isVerified: true
    });
    
    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    accessToken = loginResponse.headers['set-cookie']
      .find(cookie => cookie.includes('accessToken'))
      .split(';')[0]
      .split('=')[1];
  });

  afterEach(async () => {
    // Clean up database
    await User.deleteMany();
    await Task.deleteMany();
    if (redisClient) {
      await redisClient.flushDbAsync();
    }
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send(taskData)
        .expect(201);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(new Date(response.body.data.dueDate).toEqual(taskData.dueDate));
      expect(response.body.data.user).toBe(testUser._id.toString());
    });

    it('should return 400 for invalid task data', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          title: '', // Invalid
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        })
        .expect(400);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.errors).toHaveProperty('title');
      expect(response.body.errors).toHaveProperty('dueDate');
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should get all tasks for the user', async () => {
      // Create some tasks
      await Task.create([
        { ...taskData, user: testUser._id },
        { 
          title: 'Another Task', 
          user: testUser._id,
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      ]);
      
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].title).toBe(taskData.title);
    });

    it('should sort tasks by due date', async () => {
      // Create tasks with different due dates
      await Task.create([
        { 
          title: 'Task 1', 
          user: testUser._id,
          dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000) // 3 days
        },
        { 
          title: 'Task 2', 
          user: testUser._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        }
      ]);
      
      const response = await request(app)
        .get('/api/v1/tasks?sort=dueDate')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.data[0].title).toBe('Task 2');
      expect(response.body.data[1].title).toBe('Task 1');
    });

    it('should return empty array for new user', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.results).toBe(0);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/tasks/today', () => {
    it('should get tasks due today', async () => {
      // Create tasks with different due dates
      await Task.create([
        { 
          title: 'Today Task', 
          user: testUser._id,
          dueDate: new Date() // Today
        },
        { 
          title: 'Tomorrow Task', 
          user: testUser._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }
      ]);
      
      const response = await request(app)
        .get('/api/v1/tasks/today')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.results).toBe(1);
      expect(response.body.data[0].title).toBe('Today Task');
    });

    it('should return empty array when no tasks due today', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/today')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.results).toBe(0);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({ ...taskData, user: testUser._id });
    });

    it('should get a task by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${task._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data._id).toBe(task._id.toString());
    });

    it('should return 404 for invalid task ID', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/123456789012')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(404);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('No task found');
    });

    it('should return 404 for task not belonging to user', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
        isVerified: true
      });
      
      // Create task for other user
      const otherTask = await Task.create({
        title: 'Other Task',
        user: otherUser._id
      });
      
      const response = await request(app)
        .get(`/api/v1/tasks/${otherTask._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(404);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('No task found');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({ ...taskData, user: testUser._id });
    });

    it('should update a task', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'in-progress'
      };
      
      const response = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send(updates)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.status).toBe(updates.status);
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          title: '', // Invalid
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Past date
        })
        .expect(400);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.errors).toHaveProperty('title');
      expect(response.body.errors).toHaveProperty('dueDate');
    });

    it('should return 404 for task not belonging to user', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
        isVerified: true
      });
      
      // Create task for other user
      const otherTask = await Task.create({
        title: 'Other Task',
        user: otherUser._id
      });
      
      const response = await request(app)
        .patch(`/api/v1/tasks/${otherTask._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ title: 'Updated Title' })
        .expect(404);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('No task found');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({ ...taskData, user: testUser._id });
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(204);
      
      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for task not belonging to user', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
        isVerified: true
      });
      
      // Create task for other user
      const otherTask = await Task.create({
        title: 'Other Task',
        user: otherUser._id
      });
      
      const response = await request(app)
        .delete(`/api/v1/tasks/${otherTask._id}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(404);
      
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('No task found');
    });
  });
});