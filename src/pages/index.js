import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import Login from '../components/Login';
import Lobby from '../components/Lobby';
import AdminDashboard from '../components/AdminDashboard';
import EmojiGame from '../components/EmojiGame';
import Bingo from '../components/Bingo';
import GiftGame from '../components/GiftGame';
import SpiritWear from '../components/SpiritWear';

export default function Home() {
  const { isConnected, currentUser, appState } = useSocket();
  const [adminPlayerMode, setAdminPlayerMode] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-2">Connecting to Party Server...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  // Admin with player mode toggle
  if (currentUser.role === 'admin') {
    if (adminPlayerMode) {
      // Render the current game stage for admin in player mode
      const renderPlayerView = () => {
        switch (appState?.currentStage) {
          case 'LOBBY':
            return <Lobby />;
          case 'INTRO_EMOJI':
            return <EmojiGame />;
          case 'BINGO':
            return <Bingo />;
          case 'GIFT_GAME':
            return <GiftGame />;
          case 'SPIRIT_WEAR':
            return <SpiritWear />;
          case 'CLOSING':
            return (
              <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-24 w-24 rounded-xl shadow-2xl mb-6" />
                <h1 className="text-6xl font-bold text-yellow-400 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Happy Holidays!</h1>
                <p className="text-2xl text-white font-medium">Thank you for playing!</p>
                <div className="mt-8 text-7xl">🎆🥂🎄</div>
              </div>
            );
          default:
            return <Lobby />;
        }
      };

      return (
        <div className="relative">
          <button
            onClick={() => setAdminPlayerMode(false)}
            className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition"
          >
            ← Back to Admin
          </button>
          {renderPlayerView()}
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setAdminPlayerMode(true)}
          className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          🎮 Player Mode
        </button>
        <AdminDashboard />
      </div>
    );
  }

  // Participant View
  switch (appState?.currentStage) {
    case 'LOBBY':
      return <Lobby />;
    case 'INTRO_EMOJI':
      return <EmojiGame />;
    case 'BINGO':
      return <Bingo />;
    case 'GIFT_GAME':
      return <GiftGame />;
    case 'SPIRIT_WEAR':
      return <SpiritWear />;
    case 'CLOSING':
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
          <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-24 w-24 rounded-xl shadow-2xl mb-6" />
          <h1 className="text-6xl font-bold text-yellow-400 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Happy Holidays!</h1>
          <p className="text-2xl text-white font-medium">Thank you for playing!</p>
          <div className="mt-8 text-7xl">🎆🥂🎄</div>
        </div>
      );
    default:
      return <Lobby />;
  }
}
