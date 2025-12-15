import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const SpiritWear = () => {
    const { socket, appState, currentUser } = useSocket();
    const [hasEntered, setHasEntered] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    const enterContest = () => {
        socket.emit('spirit_enter_contest', { id: currentUser.id, name: currentUser.name });
        setHasEntered(true);
    };

    const vote = (candidateId) => {
        if (!hasVoted) {
            socket.emit('spirit_cast_vote', candidateId);
            setHasVoted(true);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="flex items-center gap-4 mb-8">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-12 w-12 rounded-lg shadow-lg" />
                <h1 className="text-4xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    👕 Spirit Wear Contest
                </h1>
            </div>

            {!hasEntered && !hasVoted && (
                <div className="mb-8 text-center bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl">
                    <p className="mb-6 text-xl text-white font-medium">Are you wearing your holiday best?</p>
                    <button
                        onClick={enterContest}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition transform hover:scale-110"
                    >
                        🎄 Enter Contest!
                    </button>
                </div>
            )}

            {hasEntered && (
                <p className="mb-8 text-green-400 font-bold text-xl bg-green-500/20 border border-green-400 px-6 py-3 rounded-xl">
                    ✅ You are entered! Good luck!
                </p>
            )}

            <div className="w-full max-w-4xl">
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">Contestants</h2>
                {appState.spiritWear.contestants.length === 0 ? (
                    <p className="text-center text-white/60 font-medium">Waiting for contestants...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {appState.spiritWear.contestants.map(c => (
                            <div key={c.id} className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-xl shadow-lg flex flex-col items-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                                    👕
                                </div>
                                <span className="font-bold text-white text-center text-lg">{c.name}</span>

                                {!hasVoted && c.id !== currentUser.id && (
                                    <button
                                        onClick={() => vote(c.id)}
                                        className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-2 px-6 rounded-full hover:from-cyan-400 hover:to-blue-500 transition"
                                    >
                                        Vote
                                    </button>
                                )}
                                {hasVoted && <span className="text-sm text-white/60 mt-3">Vote cast ✓</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpiritWear;
