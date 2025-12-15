import React from 'react';

const EmojiGame = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="flex items-center gap-4 mb-8">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-12 w-12 rounded-lg shadow-lg" />
                <h1 className="text-4xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Guess the Holiday Movie!
                </h1>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/20 p-12 rounded-2xl shadow-2xl text-center">
                <div className="text-8xl mb-6">🚢 ❄️ 💔</div>
                <p className="text-xl text-cyan-300 font-medium italic">Shout out your answer!</p>
            </div>
        </div>
    );
};

export default EmojiGame;
