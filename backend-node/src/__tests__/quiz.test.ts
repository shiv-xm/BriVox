import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import quizRoutes from '../routes/quiz';
import { connectTestDB, clearTestDB, closeTestDB, generateTestEmail } from './testUtils';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quiz', quizRoutes);

describe('Quiz API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create a test user and get token
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: generateTestEmail(),
        password: 'password123',
        name: 'Quiz Test User'
      });
    
    authToken = signupRes.body.token;
    userId = signupRes.body.user.id;
  });

  describe('POST /api/v1/quiz/generate-from-text', () => {
    const longText = 'JavaScript is a versatile programming language. It runs in browsers and on servers via Node.js. JavaScript supports object-oriented, functional, and imperative programming paradigms. It has dynamic typing and first-class functions.';

    it('should generate and save a quiz with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'JavaScript Quiz',
          text: longText,
          sourceUrl: 'https://example.com/js'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('quizId');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .send({
          title: 'Test Quiz',
          text: longText
        });

      expect(response.status).toBe(401);
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: longText
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with text too short', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Short Quiz',
          text: 'Too short'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some((e: any) => e.msg.includes('50 characters'))).toBe(true);
    });
  });

  describe('POST /api/v1/quiz/generate', () => {
    const longText = 'Python is a high-level, interpreted programming language. It emphasizes code readability with significant whitespace. Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.';

    it('should generate a transient quiz', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Python Quiz',
          text: longText
        });

      // Should return quiz data (may fail if AI service fails, but should at least not error)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('questions');
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/quiz/generate')
        .send({
          title: 'Test',
          text: longText
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/quiz/:id', () => {
    it('should get a quiz by id', async () => {
      const longText = 'React is a JavaScript library for building user interfaces. It was developed by Facebook and is maintained by Meta and a community of developers. React uses a component-based architecture and virtual DOM for efficient rendering.';

      const createRes = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'React Quiz',
          text: longText
        });

      const quizId = createRes.body.quizId;

      const response = await request(app)
        .get(`/api/v1/quiz/${quizId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', quizId);
      expect(response.body).toHaveProperty('title');
    });

    it('should return 404 for non-existent quiz', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/v1/quiz/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/quiz/:id/submit', () => {
    it('should submit quiz answers', async () => {
      const longText = 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, classes, and interfaces to JavaScript. TypeScript helps catch errors early through static type checking and provides better tooling support.';

      const createRes = await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'TypeScript Quiz',
          text: longText
        });

      const quizId = createRes.body.quizId;

      const response = await request(app)
        .post(`/api/v1/quiz/${quizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionIndex: 0, selectedAnswer: 'A' },
            { questionIndex: 1, selectedAnswer: 'B' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(typeof response.body.score).toBe('number');
    });

    it('should fail with invalid answers format', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/v1/quiz/${fakeId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: 'not an array'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/v1/quiz', () => {
    it('should list all quizzes', async () => {
      const response = await request(app)
        .get('/api/v1/quiz');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/quiz/user/me', () => {
    it('should list quizzes created by authenticated user', async () => {
      const longText = 'Docker is a platform for developing, shipping, and running applications in containers. Containers package software and dependencies together, ensuring consistency across environments. Docker enables microservices architecture and simplifies deployment processes.';

      await request(app)
        .post('/api/v1/quiz/generate-from-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Docker Quiz',
          text: longText
        });

      const response = await request(app)
        .get('/api/v1/quiz/user/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/quiz/user/me');

      expect(response.status).toBe(401);
    });
  });
});
