const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const STATE_FILE = path.join(__dirname, "gameState.json");

// Load initial state
let appState;
try {
    if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, "utf8");
        appState = JSON.parse(data);
        if (!appState.bingo.items) appState.bingo.items = [];
        if (!appState.bingo.selections) appState.bingo.selections = {};
        if (!appState.bingo.userCards) appState.bingo.userCards = {};
        if (!appState.bingo.prizes) appState.bingo.prizes = { rowColDiag: null, xPattern: null };
        // Clear activeSessions on startup
        appState.activeSessions = {};
        console.log("Loaded state from file (cleared old sessions)");
    } else {
        throw new Error("File not found");
    }
} catch (err) {
    console.log("Initializing new state");
    appState = {
        currentStage: 'LOBBY',
        activeSessions: {},
        bingo: {
            items: [],
            calledItems: [],
            winners: [],
            selections: {},
            userCards: {},
            prizes: { rowColDiag: null, xPattern: null }
        },
        gifts: { inventory: { US: [], India: [] }, allocations: {} },
        spiritWear: { contestants: [], votes: {} }
    };
}

const io = new Server(PORT, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const saveState = () => {
    fs.writeFileSync(STATE_FILE, JSON.stringify(appState, null, 2));
};

// Check if a card has a winning pattern
const checkCardForWin = (card, calledItems) => {
    const isMatch = (idx) => {
        if (card[idx] === "FREE SPACE") return true;
        return calledItems.includes(card[idx]);
    };

    // Check X pattern FIRST (both diagonals) - most specific pattern
    const diag1 = [0, 6, 12, 18, 24];
    const diag2 = [4, 8, 12, 16, 20];
    if (diag1.every(i => isMatch(i)) && diag2.every(i => isMatch(i))) return 'xPattern';

    // Check rows
    for (let r = 0; r < 5; r++) {
        if ([0, 1, 2, 3, 4].every(c => isMatch(r * 5 + c))) return 'rowColDiag';
    }
    // Check columns
    for (let c = 0; c < 5; c++) {
        if ([0, 1, 2, 3, 4].every(r => isMatch(r * 5 + c))) return 'rowColDiag';
    }
    // Check single diagonals
    if ([0, 1, 2, 3, 4].every(i => isMatch(i * 5 + i))) return 'rowColDiag';
    if ([0, 1, 2, 3, 4].every(i => isMatch(i * 5 + (4 - i)))) return 'rowColDiag';

    return null;
};

// Find all users eligible to win (have winning pattern but prize not yet claimed)
const findEligibleWinners = () => {
    const eligible = { rowColDiag: [], xPattern: [] };

    for (const [userId, card] of Object.entries(appState.bingo.userCards)) {
        const winType = checkCardForWin(card.items, appState.bingo.calledItems);

        if (winType === 'rowColDiag' && !appState.bingo.prizes.rowColDiag) {
            eligible.rowColDiag.push({ odz: card.odz, name: card.name });
        }

        if (winType === 'xPattern' && !appState.bingo.prizes.xPattern) {
            eligible.xPattern.push({ odz: card.odz, name: card.name });
        }
    }

    return eligible;
};

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.emit("state_update", appState);

    socket.on("join_session", (user) => {
        appState.activeSessions[socket.id] = { id: user.id, name: user.name };
        io.emit("active_users_update", Object.values(appState.activeSessions));
        io.emit("state_update", appState);
        saveState();
    });

    // Register user's bingo card
    socket.on("bingo_register_card", ({ userId, userName, items }) => {
        appState.bingo.userCards[userId] = { odz: userId, name: userName, items };
        saveState();
        console.log(`Registered bingo card for ${userName}`);
    });

    socket.on("admin_set_stage", (stageName) => {
        appState.currentStage = stageName;
        io.emit("state_update", appState);
        saveState();
    });

    socket.on("admin_add_bingo_item", (item) => {
        if (!appState.bingo.items.includes(item)) {
            appState.bingo.items.push(item);
            io.emit("bingo_update", appState.bingo);
            saveState();
        }
    });

    socket.on("admin_remove_bingo_item", (item) => {
        appState.bingo.items = appState.bingo.items.filter(i => i !== item);
        appState.bingo.calledItems = appState.bingo.calledItems.filter(i => i !== item);
        io.emit("bingo_update", appState.bingo);
        saveState();
    });

    socket.on("bingo_call_item", (itemId) => {
        if (!appState.bingo.calledItems.includes(itemId)) {
            appState.bingo.calledItems.push(itemId);

            // Find eligible winners
            const eligible = findEligibleWinners();

            io.emit("bingo_update", appState.bingo);
            saveState();

            // Notify eligible users they can claim
            if (eligible.rowColDiag.length > 0) {
                eligible.rowColDiag.forEach(user => {
                    io.emit("bingo_eligible_to_claim", { type: 'rowColDiag', userId: user.odz, prize: 'Backpack' });
                });
                console.log(`Eligible for Backpack: ${eligible.rowColDiag.map(u => u.name).join(', ')}`);
            }
            if (eligible.xPattern.length > 0) {
                eligible.xPattern.forEach(user => {
                    io.emit("bingo_eligible_to_claim", { type: 'xPattern', userId: user.odz, prize: 'Headphone' });
                });
                console.log(`Eligible for Headphone: ${eligible.xPattern.map(u => u.name).join(', ')}`);
            }
        }
    });

    // User claims a prize (race condition - first to claim wins)
    socket.on("bingo_claim_prize", ({ userId, userName, prizeType }) => {
        if (prizeType === 'rowColDiag' && !appState.bingo.prizes.rowColDiag) {
            // Verify user is actually eligible
            const card = appState.bingo.userCards[userId];
            if (card && checkCardForWin(card.items, appState.bingo.calledItems) === 'rowColDiag') {
                appState.bingo.prizes.rowColDiag = { odz: userId, name: userName, prize: 'Backpack' };
                io.emit("bingo_winner_announcement", { type: 'rowColDiag', userId, name: userName, prize: 'Backpack' });
                io.emit("bingo_update", appState.bingo);
                saveState();
                console.log(`CLAIMED: ${userName} won Backpack!`);
            }
        }
        if (prizeType === 'xPattern' && !appState.bingo.prizes.xPattern) {
            const card = appState.bingo.userCards[userId];
            if (card && checkCardForWin(card.items, appState.bingo.calledItems) === 'xPattern') {
                appState.bingo.prizes.xPattern = { odz: userId, name: userName, prize: 'Headphone' };
                io.emit("bingo_winner_announcement", { type: 'xPattern', userId, name: userName, prize: 'Headphone' });
                io.emit("bingo_update", appState.bingo);
                saveState();
                console.log(`CLAIMED: ${userName} won Headphone!`);
            }
        }
    });

    socket.on("bingo_mark_item", ({ item, userId, userName }) => {
        if (!appState.bingo.selections[item]) {
            appState.bingo.selections[item] = [];
        }
        if (!appState.bingo.selections[item].find(u => u.id === userId)) {
            appState.bingo.selections[item].push({ id: userId, name: userName });
            io.emit("bingo_update", appState.bingo);
            saveState();
        }
    });

    // ========== GIFT GAME LOGIC ==========

    // Admin adds a gift to a region's inventory
    socket.on("admin_add_gift", ({ region, gift }) => {
        if (!appState.gifts.inventory[region]) {
            appState.gifts.inventory[region] = [];
        }
        const newGift = {
            id: `gift_${region.toLowerCase()}_${Date.now()}`,
            name: gift.name,
            amazonLink: gift.amazonLink || '',
            imageUrl: gift.imageUrl || '',
            claimed: false,
            claimedBy: null
        };
        appState.gifts.inventory[region].push(newGift);
        io.emit("gift_update", appState.gifts);
        saveState();
        console.log(`Added gift "${gift.name}" to ${region}`);
    });

    // Admin removes a gift from inventory
    socket.on("admin_remove_gift", ({ region, giftId }) => {
        if (appState.gifts.inventory[region]) {
            appState.gifts.inventory[region] = appState.gifts.inventory[region].filter(g => g.id !== giftId);
            io.emit("gift_update", appState.gifts);
            saveState();
        }
    });

    // User opens a box - returns gift or empty
    // All users can open any box, but claimed gifts can't be claimed again
    socket.on("gift_open_box", ({ userId, region, boxIndex }) => {
        // Check if user already claimed a gift
        if (appState.gifts.claims[userId]) {
            socket.emit("gift_already_claimed", appState.gifts.claims[userId]);
            return;
        }

        // Track opened boxes for this user (for UI purposes only)
        if (!appState.gifts.openedBoxes[userId]) {
            appState.gifts.openedBoxes[userId] = [];
        }

        // Check if this user already opened this box
        if (appState.gifts.openedBoxes[userId].includes(boxIndex)) {
            return;
        }

        appState.gifts.openedBoxes[userId].push(boxIndex);

        // Get ALL gifts for this region (including claimed ones for consistent mapping)
        const allGifts = appState.gifts.inventory[region] || [];
        const boxCount = appState.gifts.boxCount?.[region] || 25;

        // Create a consistent mapping of boxes to gifts
        // Use a seeded approach so same box always has same gift
        let result;
        if (allGifts.length > 0 && boxIndex < allGifts.length) {
            // Box index directly maps to gift index (simple 1:1 mapping)
            const gift = allGifts[boxIndex];
            if (gift.claimed) {
                // Gift was claimed - show as "already taken"
                result = { type: 'taken', gift: gift, boxIndex };
            } else {
                result = { type: 'gift', gift: gift, boxIndex };
            }
        } else {
            // No gift in this box (more boxes than gifts = empty)
            result = { type: 'empty', boxIndex };
        }

        socket.emit("gift_box_result", result);
        io.emit("gift_update", appState.gifts);
        saveState();
    });

    // User claims a gift
    socket.on("gift_claim", ({ userId, userName, giftId, region }) => {
        // Check if user already claimed
        if (appState.gifts.claims[userId]) {
            socket.emit("gift_already_claimed", appState.gifts.claims[userId]);
            return;
        }

        // Find and claim the gift
        const gift = appState.gifts.inventory[region]?.find(g => g.id === giftId);
        if (gift && !gift.claimed) {
            gift.claimed = true;
            gift.claimedBy = { userId, userName, claimedAt: new Date().toISOString() };
            appState.gifts.claims[userId] = {
                giftId: gift.id,
                giftName: gift.name,
                amazonLink: gift.amazonLink,
                claimedAt: new Date().toISOString()
            };
            io.emit("gift_update", appState.gifts);
            socket.emit("gift_claim_success", appState.gifts.claims[userId]);
            saveState();
            console.log(`${userName} claimed "${gift.name}"`);
        } else {
            socket.emit("gift_claim_failed", { reason: "Gift no longer available" });
        }
    });

    // Spirit Wear Logic
    socket.on("spirit_enter_contest", (contestant) => {
        if (!appState.spiritWear.contestants.find(c => c.id === contestant.id)) {
            appState.spiritWear.contestants.push(contestant);
            io.emit("spirit_update", appState.spiritWear);
            saveState();
        }
    });

    socket.on("spirit_cast_vote", (candidateId) => {
        appState.spiritWear.votes[candidateId] = (appState.spiritWear.votes[candidateId] || 0) + 1;
        io.emit("spirit_update", appState.spiritWear);
        saveState();
    });

    socket.on("disconnect", () => {
        delete appState.activeSessions[socket.id];
        io.emit("active_users_update", Object.values(appState.activeSessions));
        saveState();
        console.log("Client disconnected:", socket.id);
    });

    // Admin Reset Data
    socket.on("admin_reset_data", () => {
        appState.bingo.calledItems = [];
        appState.bingo.winners = [];
        appState.bingo.selections = {};
        appState.bingo.userCards = {};
        appState.bingo.prizes = { rowColDiag: null, xPattern: null };
        // Reset gifts - clear claims and opened boxes, but keep inventory
        appState.gifts.claims = {};
        appState.gifts.openedBoxes = {};
        // Unmark all gifts as claimed
        Object.keys(appState.gifts.inventory || {}).forEach(region => {
            (appState.gifts.inventory[region] || []).forEach(gift => {
                gift.claimed = false;
                gift.claimedBy = null;
            });
        });
        appState.spiritWear.contestants = [];
        appState.spiritWear.votes = {};
        io.emit("state_update", appState);
        io.emit("bingo_reset");
        saveState();
        console.log("Admin reset game data (including user cards)");
    });
});

console.log(`Socket.io server running on port ${PORT}`);
