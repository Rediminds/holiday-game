import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const MontyHall = () => {
    const { socket, currentUser, appState } = useSocket();
    const [step, setStep] = useState(1);
    const [selectedDoor, setSelectedDoor] = useState(null);
    const [revealedDoor, setRevealedDoor] = useState(null);
    const [finalDoor, setFinalDoor] = useState(null);
    const [doors, setDoors] = useState([]);
    const [prize, setPrize] = useState(null);

    useEffect(() => {
        const gifts = [
            { name: "Backpack", type: "real", image: "🎒" },
            { name: "Stress Ball", type: "gag", image: "🎾" },
            { name: "Gift Card", type: "real", image: "💳" }
        ];
        const shuffled = [...gifts].sort(() => 0.5 - Math.random());
        setDoors(shuffled);
    }, []);

    const handleDoorClick = (index) => {
        if (step === 1) {
            setSelectedDoor(index);
            let toReveal = -1;
            doors.forEach((d, i) => {
                if (i !== index && d.type === 'gag') {
                    toReveal = i;
                }
            });
            if (toReveal === -1) {
                doors.forEach((d, i) => {
                    if (i !== index && toReveal === -1) toReveal = i;
                });
            }
            setRevealedDoor(toReveal);
            setStep(2);
        }
    };

    const handleFinalChoice = (keep) => {
        const finalIndex = keep ? selectedDoor : [0, 1, 2].find(i => i !== selectedDoor && i !== revealedDoor);
        setFinalDoor(finalIndex);
        const wonPrize = doors[finalIndex];
        setPrize(wonPrize);
        setStep(3);
        socket.emit('gift_finalize_choice', { userId: currentUser.id, prize: wonPrize.name });
    };

    if (doors.length === 0) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="flex items-center gap-4 mb-8">
                <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-12 w-12 rounded-lg shadow-lg" />
                <h1 className="text-4xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    🎁 Mystery Gift Box
                </h1>
            </div>

            <div className="flex gap-4 md:gap-8 mb-8">
                {doors.map((door, index) => (
                    <div
                        key={index}
                        onClick={() => handleDoorClick(index)}
                        className={`
                            w-28 h-36 md:w-44 md:h-60 rounded-xl shadow-2xl flex items-center justify-center text-4xl cursor-pointer transform transition-all duration-300 hover:scale-105
                            ${selectedDoor === index ? 'ring-4 ring-cyan-400 scale-105' : ''}
                            ${revealedDoor === index || (step === 3 && finalDoor === index)
                                ? 'bg-white'
                                : 'bg-gradient-to-b from-cyan-500 to-blue-600'}
                        `}
                    >
                        {revealedDoor === index || (step === 3 && finalDoor === index) ? (
                            <div className="text-center p-2">
                                <div className="text-5xl md:text-7xl">{door.image}</div>
                                <div className="text-sm md:text-base text-gray-800 font-bold mt-2">{door.name}</div>
                            </div>
                        ) : (
                            <span className="text-white font-bold text-2xl">#{index + 1}</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="text-center bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 min-h-32 flex items-center justify-center">
                {step === 1 && <p className="text-2xl text-white font-medium">Pick a box!</p>}
                {step === 2 && (
                    <div>
                        <p className="text-xl text-white font-medium mb-4">
                            You picked Box {selectedDoor + 1}.<br />
                            <span className="text-cyan-300">Look! Box {revealedDoor + 1} contains a {doors[revealedDoor].name}!</span>
                        </p>
                        <p className="text-lg text-white/80 mb-4">Do you want to switch?</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handleFinalChoice(true)}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 rounded-full font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition"
                            >
                                Keep Box {selectedDoor + 1}
                            </button>
                            <button
                                onClick={() => handleFinalChoice(false)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-full font-bold text-white hover:from-green-400 hover:to-emerald-500 transition"
                            >
                                Switch!
                            </button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div>
                        <p className="text-3xl font-bold text-yellow-400" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            🎉 You won: {prize.name}! 🎉
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MontyHall;
