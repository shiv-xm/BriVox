// Test setup utilities
import mongoose from 'mongoose';

export const TEST_MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/genie-test';

export async function connectTestDB() {
  await mongoose.connect(TEST_MONGO_URI);
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export function generateTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}
