// Test script to verify validation on all endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:8098/api/v1';

async function testValidation() {
  console.log('🧪 Testing input validation on endpoints...\n');

  // Test 1: Signup with missing fields
  console.log('Test 1: Signup with missing fields');
  try {
    await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'invalid',
      password: '123' // too short
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Create a valid user for subsequent tests
  let token;
  try {
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      email: `test-validation-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Validation Test'
    });
    token = signupRes.data.token;
    console.log('\n✅ Created test user for validation tests');
  } catch (err) {
    if (err.response?.status === 409) {
      // User exists, login instead
      console.log('\nUser exists, attempting login...');
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test-validation@example.com',
        password: 'password123'
      });
      token = loginRes.data.token;
    }
  }

  // Test 2: Quiz generation with missing text
  console.log('\nTest 2: Quiz generation with missing text');
  try {
    await axios.post(`${BASE_URL}/quiz/generate-from-text`, {
      title: 'Test'
      // missing text
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 3: Quiz generation with text too short
  console.log('\nTest 3: Quiz generation with text too short');
  try {
    await axios.post(`${BASE_URL}/quiz/generate-from-text`, {
      title: 'Test',
      text: 'Too short' // less than 50 chars
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 4: AI request with invalid action
  console.log('\nTest 4: AI request with invalid action');
  try {
    await axios.post(`${BASE_URL}/ai`, {
      action: 'invalid_action',
      text: 'Some text'
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 5: Compare with missing fields
  console.log('\nTest 5: Compare with missing fields');
  try {
    await axios.post(`${BASE_URL}/compare`, {
      baseConcept: 'React'
      // missing compareTo
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 6: Sources find with invalid size
  console.log('\nTest 6: Sources find with invalid size');
  try {
    await axios.post(`${BASE_URL}/sources/find`, {
      text: 'test query',
      size: 100 // exceeds max of 20
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 7: Reading suggest with missing fields
  console.log('\nTest 7: Reading suggest with missing fields');
  try {
    await axios.post(`${BASE_URL}/reading/suggest`, {
      baseSummary: 'Some summary'
      // missing candidatesJson
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  // Test 8: Submit quiz with invalid answers format
  console.log('\nTest 8: Submit quiz with invalid answers format');
  try {
    await axios.post(`${BASE_URL}/quiz/123456789012345678901234/submit`, {
      answers: 'not an array'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('❌ Should have failed validation');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.errors) {
      console.log('✅ Validation working:', err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      console.log('❌ Unexpected error:', err.response?.status, err.response?.data);
    }
  }

  console.log('\n✅ Validation test suite completed!');
}

testValidation().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
