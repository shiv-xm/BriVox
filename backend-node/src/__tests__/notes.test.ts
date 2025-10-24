import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import notesRoutes from '../routes/notes';
import { connectTestDB, clearTestDB, closeTestDB, generateTestEmail } from './testUtils';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notes', notesRoutes);

describe('Notes API Integration Tests', () => {
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
        name: 'Notes Test User'
      });
    
    authToken = signupRes.body.token;
    userId = signupRes.body.user.id;
  });

  describe('POST /api/v1/notes', () => {
    it('should create a new note with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: 'This is a test note content',
          sourceUrl: 'https://example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'This is a test note content');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({
          title: 'Test Note',
          content: 'Content'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Content without title'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with missing content', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title without content'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/v1/notes', () => {
    it('should list all notes', async () => {
      // Create some notes
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Note 1', content: 'Content 1' });

      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Note 2', content: 'Content 2' });

      const response = await request(app)
        .get('/api/v1/notes');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/notes/:id', () => {
    it('should get a specific note by id', async () => {
      const createRes = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Specific Note',
          content: 'Specific content'
        });

      const noteId = createRes.body._id;

      const response = await request(app)
        .get(`/api/v1/notes/${noteId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Specific Note');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/v1/notes/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/notes/:id', () => {
    it('should update a note', async () => {
      const createRes = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          content: 'Original content'
        });

      const noteId = createRes.body._id;

      const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('content', 'Updated content');
    });

    it('should fail without authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/v1/notes/${fakeId}`)
        .send({
          title: 'Updated',
          content: 'Updated'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/notes/:id', () => {
    it('should delete a note', async () => {
      const createRes = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Note to delete',
          content: 'Will be deleted'
        });

      const noteId = createRes.body._id;

      const response = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify it's deleted
      const getRes = await request(app)
        .get(`/api/v1/notes/${noteId}`);

      expect(getRes.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/v1/notes/${fakeId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/notes/recent/me', () => {
    it('should get recent notes for authenticated user', async () => {
      // Create notes
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'My Note 1', content: 'Content 1' });

      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'My Note 2', content: 'Content 2' });

      const response = await request(app)
        .get('/api/v1/notes/recent/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notes/recent/me');

      expect(response.status).toBe(401);
    });
  });
});
