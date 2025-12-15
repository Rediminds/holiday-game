import React from 'react';

const Lobby = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="text-center">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-24 w-24 mx-auto rounded-xl shadow-2xl mb-6 animate-bounce" />
                <h1 className="text-5xl font-bold text-white mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Welcome to the Party!
                </h1>
                <p className="text-2xl text-cyan-300 font-medium mb-8">Grab a drink, we'll start soon...</p>
                <div className="text-7xl animate-pulse">🎄🎅🎁</div>
                <div className="mt-8 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-white/80 font-medium">Waiting for the host to start the games!</p>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
