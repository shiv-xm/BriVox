const axios = require('axios');

const base = 'http://localhost:8098';

(async () => {
  try {
    const email = 'test+smoke@example.com';
    const password = 'Password123!';
    const name = 'Smoke';
    let token;

    console.log('Signing up test user...');

    try {
      const signup = await axios.post(base + '/api/v1/auth/signup', {
        email,
        password,
        name,
      });
      token = signup.data.token;
      console.log('Signup successful. Token:', token);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('User already exists, logging in instead...');
        const login = await axios.post(base + '/api/v1/auth/login', {
          email,
          password,
        });
        token = login.data.token;
        console.log('Login successful. Token:', token);
      } else {
        throw err;
      }
    }

    const headers = { Authorization: 'Bearer ' + token };

    console.log('Checking /me with token...');
    const jwt = require('jsonwebtoken');
    try {
      const decodedLocal = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      console.log('Local verify succeeded, payload:', decodedLocal);
    } catch (e) {
      console.error('Local verify failed:', e && e.message);
    }
    const me = await axios.get(base + '/api/v1/auth/me', { headers });
    console.log('/me response:', me.data);

    console.log('Generating quiz...');
    const gen = await axios.post(
      base + '/api/v1/quiz/generate-from-text',
      { title: 'Smoke Quiz', text: 'Q: What is 2+2? Options: 3,4,5. Answer: 4' },
      { headers }
    );
    console.log('Generate response:', gen.data);

    const quizId = gen.data.quizId;
    console.log('Quiz ID:', quizId);

    console.log('Listing quizzes...');
    const list = await axios.get(base + '/api/v1/quiz');
    console.log('Quizzes count:', (list.data || []).length);

    console.log('Submitting answers...');
    const submit = await axios.post(
      `${base}/api/v1/quiz/${quizId}/submit`,
      { answers: [1] },
      { headers }
    );
    console.log('Submit result:', submit.data);

    console.log('Listing attempts...');
    const attempts = await axios.get(`${base}/api/v1/quiz/${quizId}/attempts`, { headers });
    console.log('Attempts count:', (attempts.data || []).length);

    console.log('✅ Smoke test completed successfully.');
  } catch (err) {
    if (err.response)
      console.error('HTTP error', err.response.status, err.response.data);
    else console.error(err.message || err);
    process.exit(1);
  }
})();
