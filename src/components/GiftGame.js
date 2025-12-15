import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const GiftGame = () => {
    const { socket, appState, currentUser } = useSocket();
    const [openedBox, setOpenedBox] = useState(null);
    const [claimedGift, setClaimedGift] = useState(null);
    const [myOpenedBoxes, setMyOpenedBoxes] = useState([]);
    const [discoveredGifts, setDiscoveredGifts] = useState([]); // Track all gifts user has found

    const region = currentUser?.location || 'US';
    const boxCount = appState?.gifts?.boxCount?.[region] || 25;
    const availableGifts = (appState?.gifts?.inventory?.[region] || []).filter(g => !g.claimed);
    const hasClaimed = appState?.gifts?.claims?.[currentUser?.id];

    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleBoxResult = (result) => {
            setOpenedBox(result);
            if (result.boxIndex !== undefined) {
                setMyOpenedBoxes(prev => [...new Set([...prev, result.boxIndex])]);
            }
            // If it's a gift, add to discovered gifts
            if (result.type === 'gift' && result.gift) {
                setDiscoveredGifts(prev => {
                    if (prev.find(g => g.id === result.gift.id)) return prev;
                    return [...prev, result.gift];
                });
            }
        };

        const handleClaimSuccess = (claim) => {
            setClaimedGift(claim);
            setOpenedBox(null);
        };

        const handleAlreadyClaimed = (claim) => {
            setClaimedGift(claim);
        };

        socket.on('gift_box_result', handleBoxResult);
        socket.on('gift_claim_success', handleClaimSuccess);
        socket.on('gift_already_claimed', handleAlreadyClaimed);

        // Check if user already claimed
        if (appState?.gifts?.claims?.[currentUser.id]) {
            setClaimedGift(appState.gifts.claims[currentUser.id]);
        }

        // Load user's opened boxes
        if (appState?.gifts?.openedBoxes?.[currentUser.id]) {
            setMyOpenedBoxes(appState.gifts.openedBoxes[currentUser.id]);
        }

        return () => {
            socket.off('gift_box_result', handleBoxResult);
            socket.off('gift_claim_success', handleClaimSuccess);
            socket.off('gift_already_claimed', handleAlreadyClaimed);
        };
    }, [socket, currentUser, appState]);

    const openBox = (index) => {
        if (hasClaimed || claimedGift) return;
        if (myOpenedBoxes.includes(index)) return;

        socket.emit('gift_open_box', {
            userId: currentUser.id,
            region,
            boxIndex: index
        });
    };

    const claimGift = (gift) => {
        socket.emit('gift_claim', {
            userId: currentUser.id,
            userName: currentUser.name,
            giftId: gift.id,
            region
        });
    };

    const closeModal = () => {
        setOpenedBox(null);
    };

    // If user has claimed a gift, show success screen
    if (claimedGift) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-8 rounded-2xl shadow-2xl text-center max-w-md">
                    <div className="text-6xl mb-4">🎁🎉</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Congratulations!</h2>
                    <p className="text-xl text-white/90 mb-4">You claimed:</p>
                    <p className="text-2xl font-bold text-white mb-6">{claimedGift.giftName}</p>
                    {claimedGift.amazonLink && (
                        <a
                            href={claimedGift.amazonLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-green-700 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition"
                        >
                            🔗 View on Amazon
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // Filter discovered gifts to only show ones still available
    const claimableGifts = discoveredGifts.filter(g => !g.claimed && availableGifts.find(a => a.id === g.id));

    return (
        <div className="flex flex-col items-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-12 w-12 rounded-lg shadow-lg" />
                <h1 className="text-3xl font-bold text-white">🎁 Mystery Gift Boxes</h1>
            </div>

            {/* Info */}
            <div className="flex gap-4 mb-4 text-sm flex-wrap justify-center">
                <span className="bg-white/10 text-white px-4 py-2 rounded-lg">
                    📍 Region: <strong>{region}</strong>
                </span>
                <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg">
                    🎁 Gifts Available: <strong>{availableGifts.length}</strong>
                </span>
                <span className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg">
                    ✨ You Found: <strong>{claimableGifts.length}</strong> gift(s)
                </span>
            </div>

            <p className="text-cyan-300 mb-4 text-center max-w-md text-sm">
                Open boxes to discover gifts. You can open multiple boxes before deciding which one to claim!
            </p>

            {/* Discovered Gifts Section */}
            {claimableGifts.length > 0 && (
                <div className="w-full max-w-2xl mb-6 bg-white/10 backdrop-blur p-4 rounded-xl">
                    <h3 className="text-white font-bold mb-3">🎁 Your Discovered Gifts (click to claim):</h3>
                    <div className="flex flex-wrap gap-3">
                        {claimableGifts.map(gift => (
                            <div
                                key={gift.id}
                                onClick={() => claimGift(gift)}
                                className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-lg"
                            >
                                {gift.imageUrl && (
                                    <img src={gift.imageUrl} alt={gift.name} className="w-16 h-16 object-cover rounded mb-2" />
                                )}
                                <p className="text-black font-bold text-sm">{gift.name}</p>
                                <p className="text-black/60 text-xs">Click to claim</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Box Result Modal */}
            {openedBox && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className={`p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 ${openedBox.type === 'gift'
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                            : openedBox.type === 'taken'
                                ? 'bg-gradient-to-br from-red-400 to-red-600'
                                : 'bg-gradient-to-br from-gray-600 to-gray-800'
                        }`}>
                        <div className="text-6xl mb-4">
                            {openedBox.type === 'gift' ? '🎁✨' : openedBox.type === 'taken' ? '😢' : '📦'}
                        </div>

                        {openedBox.type === 'gift' ? (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">You found a gift!</h2>
                                <p className="text-xl font-bold text-black mb-4">{openedBox.gift.name}</p>
                                {openedBox.gift.imageUrl && (
                                    <img src={openedBox.gift.imageUrl} alt={openedBox.gift.name} className="w-32 h-32 object-cover mx-auto mb-4 rounded-lg" />
                                )}
                                <div className="flex gap-4 justify-center mt-6 flex-wrap">
                                    <button
                                        onClick={() => claimGift(openedBox.gift)}
                                        className="bg-green-600 text-white font-bold py-3 px-6 rounded-full hover:bg-green-700 transition"
                                    >
                                        ✅ Claim Now
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-600 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-700 transition"
                                    >
                                        🔍 Keep Looking
                                    </button>
                                </div>
                                <p className="text-black/60 text-xs mt-4">You can claim this gift later from your discovered gifts</p>
                            </>
                        ) : openedBox.type === 'taken' ? (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2">Already Claimed!</h2>
                                <p className="text-xl font-bold text-white/90 mb-2">{openedBox.gift.name}</p>
                                <p className="text-white/70 mb-6">
                                    This gift was claimed by {openedBox.gift.claimedBy?.userName || 'someone else'}
                                </p>
                                <button
                                    onClick={closeModal}
                                    className="bg-white/20 text-white font-bold py-3 px-6 rounded-full hover:bg-white/30 transition"
                                >
                                    Try Another Box
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2">Empty Box!</h2>
                                <p className="text-white/80 mb-6">Better luck with the next one! 🍀</p>
                                <button
                                    onClick={closeModal}
                                    className="bg-white/20 text-white font-bold py-3 px-6 rounded-full hover:bg-white/30 transition"
                                >
                                    Continue
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Gift Boxes Grid */}
            <div className={`grid gap-3 max-w-4xl w-full ${boxCount <= 3 ? 'grid-cols-3' : boxCount <= 9 ? 'grid-cols-3 md:grid-cols-5' : 'grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
                }`}>
                {Array.from({ length: boxCount }).map((_, index) => {
                    const isOpened = myOpenedBoxes.includes(index);

                    return (
                        <div
                            key={index}
                            onClick={() => openBox(index)}
                            className={`
                                aspect-square flex items-center justify-center rounded-xl cursor-pointer
                                transition-all duration-300 transform hover:scale-105
                                ${isOpened
                                    ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-lg'
                                }
                            `}
                        >
                            <span className="text-4xl">
                                {isOpened ? '📭' : '🎁'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <span>Unopened</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📭</span>
                    <span>Opened</span>
                </div>
            </div>
        </div>
    );
};

export default GiftGame;
