

# Technical Specification: Rediminds Holiday Party Portal

## 1\. Project Overview

This is a **Real-Time Single Page Application (SPA)** designed to host interactive holiday games for the Rediminds team. The system will support \~40 concurrent users across different locations (India, US, UK, UAE). A designated "Game Admin" will control the flow of the event, pushing stage changes (e.g., "Start Bingo") to all participant screens instantly.

**Key Requirements:**

  * **Access Control:** Strict list of pre-approved users (no open registration).
  * **Real-Time Synchronization:** Admin controls the game state; users see updates instantly without refreshing.
  * **Session Management:** One active session per user (to prevent duplicate game entries).
  * **Rapid Deployment:** Built for a one-time event, prioritizing speed of development over complex database persistence.

-----

## 2\. Technical Stack

  * **Frontend:** Next.js (React) – for rapid UI components.
  * **Styling:** Tailwind CSS – for quick, responsive holiday theming.
  * **Real-time Engine:** Socket.io – for bi-directional event communication.
  * **Backend/Storage:** Node.js with In-Memory State (initialized from JSON files). No external database (SQL/Mongo) required for this scope.

-----

## 3\. User Roster & Access Control

The system will be pre-loaded with the following users. Login is handled via a **Dropdown Menu**. When a user selects their name, the backend validates if a session is already active for that ID.

### **Pre-Populated User Data (`users.json`)**

*Note: The following list is derived from the provided roster image.*

```json
[
  // ADMINS
  { "id": "admin_1", "name": "Jai Desai", "email": "jai.desai@rediminds.com", "role": "admin", "location": "India" },
  { "id": "admin_2", "name": "Stephanie Gardella", "email": "stephanie.gardella@rediminds.com", "role": "admin", "location": "US" },
  { "id": "admin_3", "name": "Padmasri Tiruchunapalli", "email": "padmasri.t@rediminds.com", "role": "admin", "location": "India" },

  // PARTICIPANTS - US
  { "id": "us_1", "name": "Joi Danielson", "email": "joi.danielson@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_2", "name": "Luke Abbatessa", "email": "luke.abbatessa@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_3", "name": "Madhu Reddibona", "email": "madhu.reddibona@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_4", "name": "Ramez Tawil", "email": "ramez.tawil@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_5", "name": "Rita Blaty", "email": "rita.blaty@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_6", "name": "Nitish Dewan", "email": "nitish.dewan@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_7", "name": "Shefali Mehta", "email": "shefali.mehta@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_8", "name": "Shreyas Sawant", "email": "shreyas.sawant@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_9", "name": "Yash Dalvi", "email": "yash.dalvi@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_10", "name": "Travis Nichols", "email": "travis.nichols@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_11", "name": "Aditi Sonawane", "email": "aditi.sonawane@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_12", "name": "Aishwarya Karan", "email": "aishwarya.karan@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_13", "name": "Angela Nwaeke", "email": "angela.nwaeke@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_14", "name": "Joshua Leboeuf", "email": "joshua.leboeuf@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_15", "name": "Katherine Beshak", "email": "katherine.beshak@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_16", "name": "Kohul Raj Meyyazhagan", "email": "kohulraj@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_17", "name": "Mandar Mhatre", "email": "mandar.mhatre@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_18", "name": "Nishi Surana", "email": "nishi.surana@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_19", "name": "Sangavi Kaliyappan", "email": "sangavi.kaliyappan@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_20", "name": "Santiago Montano", "email": "santiago.montano@rediminds.com", "role": "participant", "location": "US" },
  { "id": "us_21", "name": "Sara Adamski", "email": "sara.adamski@rediminds.com", "role": "participant", "location": "US" },

  // PARTICIPANTS - INDIA
  { "id": "in_1", "name": "Abhipriya Bhattacharya", "email": "abhipriya.bhattacharya@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_2", "name": "Ayush Saini", "email": "ayush.saini@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_3", "name": "Aditya Balhara", "email": "aditya.balhara@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_4", "name": "Amogh Walia", "email": "amogh.walia@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_5", "name": "Arun Soni", "email": "arun.soni@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_6", "name": "Aryan Chopra", "email": "aryan.chopra@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_7", "name": "Bhushan Pawar", "email": "bhushan.pawar@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_8", "name": "Manish Mehra", "email": "manish.mehra@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_9", "name": "Prabhjot Singh", "email": "prabhjot.singh@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_10", "name": "Roshan Sanju", "email": "roshan.sanju@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_11", "name": "Rushi Sompura", "email": "rushi.sompura@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_12", "name": "Varenyam Bhardwaj", "email": "varenyam.bhardwaj@rediminds.com", "role": "participant", "location": "India" },
  { "id": "in_13", "name": "Sumit Joshi", "email": "sumit.joshi@rediminds.com", "role": "participant", "location": "India" },

  // PARTICIPANTS - OTHER
  { "id": "uk_1", "name": "Arjun Pankajakshan", "email": "arjun.pankajakshan@rediminds.com", "role": "participant", "location": "UK" },
  { "id": "uae_1", "name": "Mohammed Yousif", "email": "mohammed.yousif@rediminds.com", "role": "participant", "location": "UAE" }
]
```

-----

## 4\. Game Modules & Functionality

### **A. Admin Dashboard**

  * **Role Restriction:** Only accessible to `role: "admin"`.
  * **Global Controls:** A master "Stage Switcher" to move all connected clients between screens: `LOBBY` -\> `INTRO_EMOJI` -\> `BINGO` -\> `GIFT_GAME` -\> `SPIRIT_WEAR` -\> `CLOSING`.
  * **Live Metrics:** View real-time count of online users and game stats (e.g., "5 people have Bingo", "Spirit Wear Winner is [Name] with 12 votes").

### **B. Game 1: Emoji Movie Guess (Icebreaker)**

  * **Concept:** A simple "warm-up" screen.
  * **UI:** Admin displays an emoji sequence (e.g., 🚢❄️💔 for *Titanic*).
  * **Interaction:** No complex input; users just shout out answers in the Zoom/Teams chat. The portal simply displays the "Challenge" image.

### **C. Game 2: Holiday "Never Have I Ever" Bingo**

  * **Admin Prep:** Input \~40 "Never Have I Ever" statements (e.g., "Never have I ever re-gifted a present").
  * **Logic:**
      * **Randomization:** Upon loading the Bingo stage, the client randomly selects 24 items + 1 Free Space (Center) to generate a unique 5x5 card for each user.
      * **Synchronization:** When Admin calls a number/statement, it is broadcast to all clients.
      * **Validation:** Users can only "mark" a square if the Admin has officially called it.
      * **Win State:** If a user completes a row/diagonal, a "CLAIM BINGO" button enables. Clicking it alerts the Admin dashboard for verification.

### **D. Game 3: Monty Hall Gift Selection**

  * **Concept:** A digital version of "Let's Make a Deal."
  * **Admin Prep:** Upload gift inventory categorized by region (`US` vs `Rest of World`). Each gift entry includes: Name, Photo URL, Amazon Link (optional), Type (Real or Gag).
  * **User Flow:**
    1.  User enters stage; system detects location (e.g., India).
    2.  System randomly assigns 3 gifts behind 3 closed doors/boxes (e.g., 1 Backpack, 1 Stress Ball, 1 Gift Card).
    3.  User clicks **Box 1** to select it (it remains closed).
    4.  **The Reveal:** System automatically opens one of the unchosen boxes (e.g., Box 2) to reveal a "Gag Gift" (Stress Ball).
    5.  **The Choice:** System prompts: *"You picked Box 1. Box 2 was a gag gift. Do you want to switch to Box 3?"*
    6.  User confirms final choice -\> Prize revealed -\> Result sent to Admin stats.

### **E. Game 4: Spirit Wear Contest**

  * **Flow:**
    1.  **Submission:** Users click "Enter Contest" (optional photo upload or just name entry).
    2.  **Gallery:** Admin switches mode to `VOTING`. All entrants appear in a grid on everyone's screen.
    3.  **Voting:** Each user gets 1 vote.
    4.  **Results:** Admin clicks "Reveal Winner." The system calculates the highest vote count and triggers a confetti animation with the winner's name on all screens.

-----

## 5\. Development Plan (Backend Logic)

### **State Object**

The server (Node.js) will hold a simple in-memory state object:

```javascript
let appState = {
  currentStage: 'LOBBY',
  activeSessions: {
    // 'socket_id': 'user_id' (Prevent double login)
  },
  bingo: {
    calledItems: [], // IDs of statements read by admin
    winners: []      // List of user IDs who claimed bingo
  },
  gifts: {
    inventory: { US: [...], India: [...] },
    allocations: {
      // 'user_id': { chosenBox: 1, finalPrize: 'Backpack', status: 'COMPLETE' }
    }
  },
  spiritWear: {
    contestants: [],
    votes: {} // 'candidate_id': vote_count
  }
};
```

### **Real-Time Events (Socket.io)**

  * `join_session(userId)`: Validate user, update roster.
  * `admin_set_stage(stageName)`: Broadcast redirect to all clients.
  * `bingo_call_item(itemId)`: Enable square on client grids.
  * `bingo_claim_win(userId)`: Notify admin.
  * `gift_finalize_choice(boxId)`: Record prize, update inventory.
  * `spirit_cast_vote(candidateId)`: Increment vote count.

-----

## 6\. Next Steps for Developer

1.  **Scaffold:** Initialize Next.js project with Tailwind CSS.
2.  **Data:** Copy the `users.json` block above into the root directory.
3.  **Server:** Set up the Socket.io server to handle the `appState` object and events listed in Section 5.
4.  **UI:** Build the 5 views (Login, Bingo, Monty Hall, Spirit Wear, Admin).
5.  **Deploy:** Deploy to Vercel (Frontend) + Heroku/Render (Socket Server) or a custom VPS for the event duration.