import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import { redisClient } from '../config/db.js';

describe('Authentication API', () => {
  let testUser;
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!'
  };

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create(userData);
  });

  afterEach(async () => {
    // Clean up database
    await User.deleteMany();
    if (redisClient) {
      await redisClient.flushDbAsync();
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'NewPass123!'
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Verification email sent');
      expect(response.body.data.name).toBe('New User');
      expect(response.body.data.email).toBe('new@example.com');
      
      // Check if cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 400 for invalid registration data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'A', // Too short
          email: 'invalid-email',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('validation');
      expect(response.body.errors).toHaveProperty('name');
      expect(response.body.errors).toHaveProperty('email');
      expect(response.body.errors).toHaveProperty('password');
    });

    it('should return 400 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Verify user first
      testUser.isVerified = true;
      await testUser.save();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
      
      // Check if cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Incorrect email or password');
    });

    it('should return 401 for unverified email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('verify your email first');
    });
  });

  describe('GET /api/v1/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Generate verification token
      const token = testUser.generateVerificationToken();
      await testUser.save();

      const response = await request(app)
        .get(`/api/v1/auth/verify-email?token=${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Email verified successfully');
      
      // Verify user is marked as verified
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isVerified).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email?token=invalidtoken')
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Token is invalid');
    });

    it('should return 400 for expired token', async () => {
      // Generate and expire token
      const token = testUser.generateVerificationToken();
      testUser.verificationTokenExpires = Date.now() - 1000; // 1 second in past
      await testUser.save();

      const response = await request(app)
        .get(`/api/v1/auth/verify-email?token=${token}`)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Token is invalid');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('reset instructions sent');
      
      // Verify reset token was generated
      const user = await User.findById(testUser._id);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    it('should return success even for non-existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('If your email is registered');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Generate reset token
      resetToken = testUser.generatePasswordResetToken();
      await testUser.save();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post(`/api/v1/auth/reset-password?token=${resetToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Password reset successful');
      
      // Verify password was changed
      const user = await User.findById(testUser._id).select('+password');
      const isMatch = await user.comparePassword('NewPassword123!');
      expect(isMatch).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password?token=invalidtoken')
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Token is invalid');
    });

    it('should return 400 for expired token', async () => {
      // Expire token
      testUser.resetPasswordExpires = Date.now() - 1000;
      await testUser.save();

      const response = await request(app)
        .post(`/api/v1/auth/reset-password?token=${resetToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Token is invalid');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    let accessToken;

    beforeEach(async () => {
      // Login to get access token
      testUser.isVerified = true;
      await testUser.save();
      
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

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: userData.password,
          newPassword: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Password changed');
      
      // Verify new password works
      const user = await User.findById(testUser._id).select('+password');
      const isMatch = await user.comparePassword('NewSecurePassword123!');
      expect(isMatch).toBe(true);
    });

    it('should return 401 for incorrect current password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewSecurePassword123!'
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('current password is incorrect');
    });
  });

  describe('GET /api/v1/auth/logout', () => {
    let accessToken;

    beforeEach(async () => {
      // Login to get access token
      testUser.isVerified = true;
      await testUser.save();
      
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

    it('should logout user and clear cookies', async () => {
      const response = await request(app)
        .get('/api/v1/auth/logout')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Logged out');
      
      // Check cookies are cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => 
        cookie.includes('accessToken=;') && cookie.includes('Expires=Thu, 01 Jan 1970')
      )).toBe(true);
      expect(cookies.some(cookie => 
        cookie.includes('refreshToken=;') && cookie.includes('Expires=Thu, 01 Jan 1970')
      )).toBe(true);
    });
  });
});