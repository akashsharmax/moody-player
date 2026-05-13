# 🎵 Moody Player — AI-Powered Music Recommendation System

> Detect your emotion in real-time using your camera, and get personalized music recommendations instantly.

![Moody Player Banner](https://img.shields.io/badge/Moody-Player-7c6af7?style=for-the-badge&logo=music&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat&logo=mongodb&logoColor=white)
![face-api.js](https://img.shields.io/badge/face--api.js-0.22-blueviolet?style=flat)

---

## ✨ Features

- 🎭 **Real-time emotion detection** via webcam using `face-api.js`
- 🎵 **Dynamic song recommendations** based on detected mood
- 📊 **Mood history tracking** — all sessions saved to MongoDB
- 📚 **Full song library** with mood-based filtering
- 🌐 **REST API** with clean Express.js architecture
- 💾 **MongoDB** integration with Mongoose ODM
- 🎨 **Stunning dark UI** with ambient animations

## 🧠 Supported Emotions

| Emotion | Emoji | Music Style |
|---------|-------|-------------|
| Happy   | 😄 | Upbeat pop, funk, dance |
| Sad     | 😢 | Soul, indie, ambient |
| Angry   | 😠 | Metal, rock, nu-metal |
| Surprised | 😲 | Synth-pop, indie rock |
| Neutral | 😐 | Ambient, classical, neoclassical |
| Fearful | 😨 | Alternative, dark indie |
| Disgusted | 🤢 | Grunge, heavy metal |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS |
| Emotion AI | face-api.js (TinyFaceDetector + FaceExpressionNet) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| API Style | RESTful |
| Dev Tool | Nodemon |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/moody-player.git
cd moody-player
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/moody-player
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open in browser
```
http://localhost:5000
```

> 🎉 Songs are auto-seeded into MongoDB on first run!

---

## 📁 Project Structure

```
moody-player/
├── server.js                  # Express app entry point
├── package.json
├── .env.example
│
├── models/
│   ├── Song.js                # Song schema (title, artist, mood, etc.)
│   ├── MoodLog.js             # Mood detection log schema
│   └── seedData.js            # Initial song dataset (25+ songs)
│
├── routes/
│   ├── songRoutes.js          # GET /api/songs
│   └── moodRoutes.js          # POST /api/mood/log, GET /api/mood/history
│
├── controllers/
│   ├── songController.js      # Song query logic
│   └── moodController.js      # Mood logging + retrieval logic
│
└── public/                    # Frontend (served as static)
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js             # face-api.js integration + API calls
```

---

## 🔌 REST API Reference

### Songs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/songs?mood=happy` | Get songs by mood |
| `GET` | `/api/songs/all` | Get all songs |

**Example Response:**
```json
{
  "success": true,
  "mood": "happy",
  "count": 5,
  "songs": [
    {
      "_id": "...",
      "title": "Happy",
      "artist": "Pharrell Williams",
      "mood": "happy",
      "genre": "Pop",
      "duration": "3:53",
      "coverColor": "#f7b731"
    }
  ]
}
```

### Mood Logging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mood/log` | Log a detected mood |
| `GET`  | `/api/mood/history` | Get recent mood history |

**POST Body:**
```json
{
  "mood": "happy",
  "confidence": 0.92
}
```

---

## 🎭 How It Works

```
User opens camera
      ↓
face-api.js (TinyFaceDetector + FaceExpressionNet)
      ↓
Detects facial landmarks → Expression probabilities
      ↓
Top emotion extracted (e.g., "happy" @ 89%)
      ↓
POST /api/mood/log  →  MongoDB saves the session
      ↓
GET /api/songs?mood=happy  →  Returns shuffled playlist
      ↓
Songs rendered in UI with Now Playing bar
```

---

## 🤖 face-api.js Integration

```javascript
// Detect expression from live video
const detection = await faceapi
  .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
  .withFaceExpressions();

// Extract top emotion
const expressions = detection.expressions;
const [mood, confidence] = Object.entries(expressions)
  .sort((a, b) => b[1] - a[1])[0];
// mood = "happy", confidence = 0.94
```

Models used:
- `TinyFaceDetector` — lightweight, real-time face detection
- `FaceExpressionNet` — 7-class emotion classification

---

## 📸 Screenshots

> Add screenshots here after running the app locally.

| Detect Tab | Library Tab | History Tab |
|-----------|------------|-------------|
| Camera + live emotion | All songs grid | Past mood logs |

---

## 🔮 Future Improvements

- [ ] Spotify API integration for real track playback
- [ ] JWT authentication for personalized history
- [ ] Mood trend analytics dashboard
- [ ] Mobile PWA support
- [ ] Socket.io for multi-user mood sharing

---

## 👨‍💻 Author

**Akash Sharma**
- GitHub: [@YOUR_USERNAME](https://github.com/akashsharmax)
- LinkedIn: [https://www.linkedin.com/in/akash-sharma-a7b96a245/)

---

## 📄 License

MIT License — feel free to use, modify, and share.

---

> ⭐ If you found this project useful, please give it a star!
