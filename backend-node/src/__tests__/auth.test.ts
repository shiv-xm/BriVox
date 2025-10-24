import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { connectTestDB, clearTestDB, closeTestDB, generateTestEmail } from './testUtils';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const email = generateTestEmail();
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', email);
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('email');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: generateTestEmail(),
          password: '123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some((e: any) => e.msg.includes('6 characters'))).toBe(true);
    });

    it('should fail with missing name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: generateTestEmail(),
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail when email already exists', async () => {
      const email = generateTestEmail();
      
      // First signup
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'password123',
          name: 'Test User'
        });

      // Second signup with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'password456',
          name: 'Another User'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testEmail = 'login-test@example.com';
    const testPassword = 'password123';

    beforeEach(async () => {
      // Create a user before each login test
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Login Test User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testEmail);
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: testPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data with valid token', async () => {
      const email = generateTestEmail();
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'password123',
          name: 'Me Test User'
        });

      const token = signupRes.body.token;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', email);
      expect(response.body).toHaveProperty('name', 'Me Test User');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
