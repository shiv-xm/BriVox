// Test new features: health, categorization, generateFromUrl
const axios = require('axios');

const BASE_URL = 'http://localhost:8098';

async function testNewFeatures() {
  console.log('🧪 Testing newly added features...\n');

  // Test 1: Health endpoint
  console.log('Test 1: Health check endpoint');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health endpoint working:', response.data);
  } catch (err) {
    console.log('❌ Health endpoint failed:', err.response?.status, err.response?.data);
  }

  // Create a test user for subsequent tests
  let token;
  try {
    const signupRes = await axios.post(`${BASE_URL}/api/v1/auth/signup`, {
      email: `test-new-features-${Date.now()}@example.com`,
      password: 'password123',
      name: 'New Features Test'
    });
    token = signupRes.data.token;
    console.log('\n✅ Created test user');
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('\nUser exists, logging in...');
      const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'test-new-features@example.com',
        password: 'password123'
      });
      token = loginRes.data.token;
    }
  }

  // Test 2: Note with categorization
  console.log('\nTest 2: Create note with AI categorization');
  try {
    const response = await axios.post(`${BASE_URL}/api/notes`, {
      text: 'JavaScript is a versatile programming language used for web development. It supports both frontend and backend development.',
      categorize: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Note with categorization created');
    console.log('   Categories:', response.data.categoriesJson || 'N/A');
    console.log('   Note ID:', response.data._id);
  } catch (err) {
    console.log('❌ Note categorization failed:', err.response?.status, err.response?.data);
  }

  // Test 3: Generate quiz from URL
  console.log('\nTest 3: Generate quiz from URL');
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/quiz/generate-from-url`, {
      url: 'https://example.com'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Quiz from URL generated');
    console.log('   Quiz ID:', response.data.id);
    console.log('   Open URL:', response.data.openUrl);
  } catch (err) {
    console.log('⚠️  Quiz from URL (may fail if URL is not accessible):', err.response?.status, err.response?.data?.message);
  }

  console.log('\n✅ New features test completed!');
}

testNewFeatures().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
