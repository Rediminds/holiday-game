import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const Bingo = () => {
    const { socket, appState, currentUser } = useSocket();
    const [card, setCard] = useState([]);
    const [marked, setMarked] = useState([]);
    const [winnerPopup, setWinnerPopup] = useState(null);
    const [canClaim, setCanClaim] = useState({ rowColDiag: false, xPattern: false });
    const justResetRef = useRef(false);

    // Generate and register card, load marked items
    useEffect(() => {
        if (!appState?.bingo?.items || !currentUser || !socket) return;

        // Skip card generation if a reset just happened
        if (justResetRef.current) {
            justResetRef.current = false;
            return;
        }

        const cardStorageKey = `bingo_card_${currentUser.id}`;
        const markedStorageKey = `bingo_marked_${currentUser.id}`;
        const savedCard = localStorage.getItem(cardStorageKey);
        const savedMarked = localStorage.getItem(markedStorageKey);

        let cardItems;
        let needsNewCard = false;

        if (savedCard) {
            cardItems = JSON.parse(savedCard);
            // Validate that saved card items are from current bingo items
            const validItems = cardItems.filter(item =>
                item === "FREE SPACE" || appState.bingo.items.includes(item)
            );
            // If more than 5 items are invalid, regenerate the card
            if (validItems.length < 20) {
                console.log('Card items outdated, regenerating...');
                needsNewCard = true;
                localStorage.removeItem(markedStorageKey); // Clear old marked items too
            } else {
                setCard(cardItems);
                if (savedMarked) {
                    setMarked(JSON.parse(savedMarked));
                }
            }
        } else {
            needsNewCard = true;
        }

        if (needsNewCard) {
            const availableItems = appState.bingo.items;
            if (availableItems.length < 24) return;

            const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 24);
            selected.splice(12, 0, "FREE SPACE");
            cardItems = selected;
            setCard(cardItems);
            setMarked([]);
            localStorage.setItem(cardStorageKey, JSON.stringify(cardItems));
        }

        socket.emit('bingo_register_card', {
            userId: currentUser.id,
            userName: currentUser.name,
            items: cardItems
        });
    }, [appState?.bingo?.items, currentUser, socket]);

    // Listen for winner announcements and eligible notifications
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleWinner = (winner) => {
            setWinnerPopup(winner);
            setCanClaim(prev => ({
                ...prev,
                [winner.type]: false
            }));
            setTimeout(() => setWinnerPopup(null), 8000);
        };

        const handleEligible = ({ type, userId, prize }) => {
            if (userId === currentUser.id) {
                setCanClaim(prev => ({ ...prev, [type]: true }));
            }
        };

        const handleReset = () => {
            // Set flag to prevent immediate card regeneration
            justResetRef.current = true;
            // Clear localStorage and reset state
            localStorage.removeItem(`bingo_card_${currentUser.id}`);
            localStorage.removeItem(`bingo_marked_${currentUser.id}`);
            setCard([]);
            setMarked([]);
            setCanClaim({ rowColDiag: false, xPattern: false });
            console.log('Bingo reset - cards cleared');
        };

        socket.on('bingo_winner_announcement', handleWinner);
        socket.on('bingo_eligible_to_claim', handleEligible);
        socket.on('bingo_reset', handleReset);

        return () => {
            socket.off('bingo_winner_announcement', handleWinner);
            socket.off('bingo_eligible_to_claim', handleEligible);
            socket.off('bingo_reset', handleReset);
        };
    }, [socket, currentUser]);

    const isCalled = (item) => {
        if (item === "FREE SPACE") return true;
        return appState.bingo.calledItems?.includes(item);
    };

    const handleClick = (item, index) => {
        if (isCalled(item) && !marked.includes(index)) {
            const newMarked = [...marked, index];
            setMarked(newMarked);
            localStorage.setItem(`bingo_marked_${currentUser.id}`, JSON.stringify(newMarked));
            if (socket) {
                socket.emit('bingo_mark_item', {
                    item,
                    userId: currentUser.id,
                    userName: currentUser.name
                });
            }
        }
    };

    const claimPrize = (prizeType) => {
        socket.emit('bingo_claim_prize', {
            userId: currentUser.id,
            userName: currentUser.name,
            prizeType
        });
        setCanClaim(prev => ({ ...prev, [prizeType]: false }));
    };

    const prizes = appState?.bingo?.prizes || {};
    const backpackWon = prizes.rowColDiag !== null;
    const headphoneWon = prizes.xPattern !== null;
    const gameOver = headphoneWon;

    return (
        <div className="flex flex-col items-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            {/* Winner Popup */}
            {winnerPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-bounce">
                        <div className="text-6xl mb-4">🎉🏆🎉</div>
                        <h2 className="text-3xl font-bold text-black mb-2">BINGO WINNER!</h2>
                        <p className="text-2xl font-bold text-black mb-4">{winnerPopup.name}</p>
                        <p className="text-xl text-black/80">Won the <span className="font-bold">{winnerPopup.prize}</span>!</p>
                        <p className="text-sm text-black/60 mt-4">({winnerPopup.type === 'xPattern' ? 'X Pattern' : 'Row/Column/Diagonal'})</p>
                    </div>
                </div>
            )}

            {/* Claim Prize Popup */}
            {(canClaim.rowColDiag && !backpackWon) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-pulse">
                        <div className="text-6xl mb-4">🎒</div>
                        <h2 className="text-3xl font-bold text-white mb-2">YOU GOT BINGO!</h2>
                        <p className="text-xl text-white/90 mb-6">Claim your Backpack prize now!</p>
                        <button
                            onClick={() => claimPrize('rowColDiag')}
                            className="bg-white text-green-700 font-bold py-4 px-8 rounded-full text-2xl shadow-lg hover:scale-110 transition-all"
                        >
                            🏆 CLAIM BACKPACK!
                        </button>
                    </div>
                </div>
            )}

            {(canClaim.xPattern && !headphoneWon) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-purple-400 to-pink-600 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-pulse">
                        <div className="text-6xl mb-4">🎧</div>
                        <h2 className="text-3xl font-bold text-white mb-2">X PATTERN BINGO!</h2>
                        <p className="text-xl text-white/90 mb-6">Claim your Headphone prize now!</p>
                        <button
                            onClick={() => claimPrize('xPattern')}
                            className="bg-white text-purple-700 font-bold py-4 px-8 rounded-full text-2xl shadow-lg hover:scale-110 transition-all"
                        >
                            🏆 CLAIM HEADPHONE!
                        </button>
                    </div>
                </div>
            )}

            {/* Header with Logo */}
            <div className="flex items-center gap-4 mb-2">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-12 w-12 rounded-lg shadow-lg" />
                <h1 className="text-3xl font-bold text-white">Holiday Bingo</h1>
            </div>

            {/* Prizes Status */}
            <div className="flex gap-4 mb-4">
                <div className={`px-4 py-2 rounded-lg ${backpackWon ? 'bg-gray-600 line-through' : 'bg-gradient-to-r from-cyan-500 to-blue-600'} text-white font-medium`}>
                    🎒 Backpack {backpackWon ? `→ ${prizes.rowColDiag?.name}` : '(Row/Col/Diagonal)'}
                </div>
                <div className={`px-4 py-2 rounded-lg ${headphoneWon ? 'bg-gray-600 line-through' : 'bg-gradient-to-r from-pink-500 to-purple-600'} text-white font-medium`}>
                    🎧 Headphone {headphoneWon ? `→ ${prizes.xPattern?.name}` : '(X Pattern)'}
                </div>
            </div>

            {gameOver && (
                <div className="mb-4 bg-red-500/20 border border-red-400 text-red-200 px-6 py-3 rounded-xl text-lg font-bold">
                    🏁 Game Over! All prizes claimed!
                </div>
            )}

            <p className="text-cyan-300 mb-4 text-sm font-medium">
                "Never Have I Ever..." - Be the first to claim when you get Bingo!
            </p>

            {/* Bingo Grid */}
            <div className="grid grid-cols-5 gap-1 max-w-2xl w-full bg-white/10 backdrop-blur p-3 rounded-xl shadow-2xl border border-white/20">
                {card.map((item, index) => {
                    const called = isCalled(item);
                    const isMarkedCell = marked.includes(index) || item === "FREE SPACE";
                    const isFreeSpace = item === "FREE SPACE";

                    return (
                        <div
                            key={index}
                            onClick={() => handleClick(item, index)}
                            className={`
                                aspect-square flex items-center justify-center p-2 
                                text-xs font-medium text-center rounded-lg cursor-pointer 
                                transition-all duration-300 transform hover:scale-105
                                ${isFreeSpace
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-bold shadow-lg'
                                    : isMarkedCell
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-lg ring-2 ring-green-300'
                                        : called
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold shadow-lg ring-2 ring-cyan-300 animate-pulse'
                                            : 'bg-white/90 text-gray-800 hover:bg-white'
                                }
                                ${!called && !isFreeSpace ? 'opacity-60' : ''}
                            `}
                            style={{ minHeight: '80px' }}
                        >
                            <span className="leading-tight">{item}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse"></div>
                    <span>Called</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600"></div>
                    <span>Marked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white/60"></div>
                    <span>Not called</span>
                </div>
            </div>
        </div>
    );
};

export default Bingo;
