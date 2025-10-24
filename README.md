# BriVox

**BriVox** is an intelligent Chrome extension that transforms your reading and learning experience with AI-powered features including text summarization, explanations, translations, and interactive quizzes.

## ✨ Features

- 🤖 **AI-Powered Reading Assistant**: Summarize, explain, and rewrite text using Chrome's built-in AI and Google Gemini
- 📝 **Smart Note-Taking**: Create and manage notes with AI-enhanced suggestions
- 🎯 **Interactive Quizzes**: Generate quizzes from your reading material to test comprehension
- 🌐 **Multi-language Support**: Translate and explain content in multiple languages
- 📚 **PDF Support**: Read and annotate PDF documents directly in the browser
- 💾 **Cloud Sync**: Save your notes and progress with MongoDB backend

## Tech Stack

### Extension
- Chrome Manifest V3
- Vanilla JavaScript
- Chrome Built-in AI APIs (Summarizer, Writer, Rewriter)
- Google Gemini API
- PDF.js for PDF rendering

### Backend
- Node.js with Express
- TypeScript
- MongoDB for data storage
- JWT authentication
- Docker support

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or via Docker)
- Chrome browser with AI APIs enabled

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend-node
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/genie_project
JWT_SECRET=your_jwt_secret_here
PORT=8098
```

4. Start MongoDB (using Docker):
```bash
docker run -d --name brivox-mongodb -p 27017:27017 mongo:latest
```

5. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:8098`

### Extension Setup

1. Navigate to the extension directory:
```bash
cd extention
```

2. Install dependencies:
```bash
npm install
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extention` folder

## Usage

1. **Sign Up/Login**: Click on the BriVox extension icon and create an account
2. **Reading Mode**: Navigate to any webpage and use the toolbar to:
   - Summarize selected text
   - Get explanations
   - Rewrite content
   - Translate text
3. **Take Notes**: Save important information with AI-enhanced notes
4. **Quiz Yourself**: Generate quizzes from your reading material
5. **PDF Reader**: Open PDF files in the extension's built-in reader

## Project Structure

```
.
├── backend-node/          # Node.js backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Auth middleware
│   └── Dockerfile
├── extention/            # Chrome extension
│   ├── background.js     # Service worker
│   ├── content/          # Content scripts
│   ├── popup/            # Extension popup UI
│   ├── pages/            # Reader and onboarding pages
│   └── manifest.json
└── docker-compose.yml
```

## API Endpoints

- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `GET /notes` - Get user notes
- `POST /notes` - Create note
- `POST /quiz/generate` - Generate quiz
- `POST /ai/summarize` - AI summarization
- `GET /health` - Health check

## Development

### Running Tests
```bash
cd backend-node
npm test
```

### Building
```bash
cd extention
npm run build
```

## Docker Support

Run the entire stack with Docker Compose:
```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

Created by [shiv-xm](https://github.com/shiv-xm)

## Acknowledgments

- Chrome Built-in AI APIs
- Google Gemini API
- PDF.js library
