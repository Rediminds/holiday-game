# 🎄 Rediminds Holiday Party Game

A real-time, interactive holiday party game platform built with Next.js and Socket.io. Features multiple mini-games designed for remote team celebrations.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-white)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🎮 Games Included

### 1. 🎯 Emoji Game (Intro)
- Users select emojis that represent their holiday mood
- Fun icebreaker to start the party
- Admin can see all selections in real-time

### 2. 🎱 Never Have I Ever Bingo
- Each player gets a randomized 5x5 bingo card
- Admin calls out "Never Have I Ever" statements
- Players mark their cards when statements apply to them
- **Two Prizes:**
  - 🎒 **Backpack Prize** - First to complete a row, column, or diagonal
  - 🎧 **Headphone Prize** - First to complete the X pattern (both diagonals)
- Race-to-claim system for simultaneous wins

### 3. 🎁 Mystery Gift Game
- Players see a grid of gift boxes (25 for US/India, 3 for UK/UAE/Lebanon)
- Open boxes to discover gifts or empty boxes
- **Shared experience:** All users can open the same boxes
- Browse multiple gifts before deciding which to claim
- Once claimed, a gift is no longer available to others
- Geography-based gift pools (admin sets gifts per region)

### 4. 👕 Spirit Wear Contest
- Users enter the contest by submitting their holiday outfit
- Others vote for their favorite
- Live vote counting

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Socket.io      │
│   (Port 3000)   │◀────│  Server         │
│                 │     │  (Port 3001)    │
└─────────────────┘     └─────────────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
           ┌───────────────┐
           │ gameState.json│
           │ (Persistence) │
           └───────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start both servers (in separate terminals)
npm run dev          # Next.js on port 3000
node server.js       # Socket.io on port 3001

# Open http://localhost:3000
```

### Docker

```bash
# Using docker-compose
docker compose up --build

# Or build single container
docker build -t holiday-game .
docker run -p 3000:3000 -p 3001:3001 holiday-game
```

## 👤 User Roles

### Admin
- Control game stages
- Add/remove bingo items
- Call bingo numbers
- Add gifts per region
- View all claims and statistics
- Reset game data

**Admin accounts:** Users with IDs starting with `admin_` in `users.json`

### Participant
- Join games
- Interact with all mini-games
- Claim gifts
- Vote in contests

## 📁 Project Structure

```
holiday-game/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.js  # Admin control panel
│   │   ├── Bingo.js           # Bingo game
│   │   ├── GiftGame.js        # Gift box game
│   │   ├── EmojiGame.js       # Emoji selector
│   │   ├── SpiritWear.js      # Spirit wear contest
│   │   ├── Login.js           # User login
│   │   └── Lobby.js           # Waiting room
│   ├── context/
│   │   └── SocketContext.js   # Socket.io provider
│   └── pages/
│       ├── index.js           # Main app router
│       └── api/
│           └── upload.js      # Image upload API
├── server.js                   # Socket.io server
├── users.json                  # User database
├── gameState.json             # Persistent game state
├── Dockerfile                 # Combined container
├── docker-compose.yml         # Multi-container setup
└── DEPLOY.md                  # GCS deployment guide
```

## 🌍 Geography-Based Features

Users are assigned to regions in `users.json`:
- **US** - 21 participants → 25 gift boxes
- **India** - 13 participants → 25 gift boxes
- **UK** - 1 participant (Arjun) → 3 gift boxes
- **UAE** - 1 participant (Mohammed) → 3 gift boxes
- **Lebanon** - 1 participant (Ramez) → 3 gift boxes

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` |
| `PORT` | Socket.io server port | `3001` |

## 🔐 Authentication

Simple password-based login:
- Users select their name from a dropdown
- Admin password: `holidayparty` (configurable in Login.js)

## 📡 Socket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join_session` | User logs in |
| `admin_set_stage` | Change game stage |
| `bingo_call_item` | Admin calls a bingo item |
| `bingo_select_item` | Player marks an item |
| `gift_open_box` | Open a gift box |
| `gift_claim` | Claim a discovered gift |
| `admin_add_gift` | Add gift to inventory |

### Server → Client
| Event | Description |
|-------|-------------|
| `state_update` | Full state sync |
| `bingo_update` | Bingo state change |
| `gift_update` | Gift state change |
| `bingo_winner_announcement` | Winner notification |
| `gift_box_result` | Result of opening a box |

## 🚢 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed GCS/Cloud Run deployment instructions.

## 📝 License

Internal use only - Rediminds Inc.

---

Made with ❤️ for Rediminds Holiday Party 2024
