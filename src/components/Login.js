import React, { useState } from 'react';
import users from '../../users.json';
import { useSocket } from '../context/SocketContext';

const Login = () => {
    const { login } = useSocket();
    const [selectedId, setSelectedId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        const user = users.find(u => u.id === selectedId);
        if (!user) {
            setError('Please select a user');
            return;
        }

        let isValid = false;
        if (user.role === 'admin') {
            isValid = password.toLowerCase() === 'holidayparty';
        } else {
            const firstName = user.name.split(' ')[0].toLowerCase();
            isValid = password.toLowerCase() === firstName;
        }

        if (isValid) {
            setError('');
            login(user);
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    const selectedUser = users.find(u => u.id === selectedId);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <img src="/rediminds_logo.jpg" alt="Rediminds" className="h-20 w-20 mx-auto rounded-xl shadow-lg mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Rediminds</h1>
                    <h2 className="text-xl font-semibold text-cyan-300">🎄 Holiday Party 2024 🎄</h2>
                </div>

                <p className="mb-6 text-center text-white/80 font-medium">Select your name and enter your password to join!</p>

                <select
                    className="w-full p-4 border-0 rounded-xl mb-4 bg-white/90 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg"
                    value={selectedId}
                    onChange={(e) => {
                        setSelectedId(e.target.value);
                        setError('');
                    }}
                >
                    <option value="">-- Select Your Name --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.location})
                        </option>
                    ))}
                </select>

                <input
                    type="password"
                    placeholder={selectedUser?.role === 'admin' ? 'Admin Password' : 'Your First Name'}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full p-4 border-0 rounded-xl mb-4 bg-white/90 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg"
                />

                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded-xl text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={!selectedId || !password}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-xl transition duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg text-lg"
                >
                    🎉 Enter Party
                </button>

                <p className="mt-6 text-sm text-center text-white/60 font-medium">
                    {selectedUser?.role === 'admin'
                        ? '🔐 Use the admin password to login.'
                        : '💡 Hint: Your password is your first name.'}
                </p>
            </div>
        </div>
    );
};

export default Login;
