import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import usersData from '../../users.json';

const STAGES = ['LOBBY', 'INTRO_EMOJI', 'BINGO', 'GIFT_GAME', 'SPIRIT_WEAR', 'CLOSING'];

// Helper to convert user ID to name
const getUserName = (userId) => {
    const user = usersData.find(u => u.id === userId);
    return user ? user.name : userId;
};

const REGIONS = ['US', 'India', 'UK', 'UAE', 'Lebanon'];

// Users Tab Component
const UsersTab = () => {
    const [users, setUsers] = useState(usersData);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'participant', location: 'US' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const refreshUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to refresh users:', err);
        }
    };

    const addUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            setError('Name and email are required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to add user');
            } else {
                setSuccess(`User "${data.name}" added successfully!`);
                setNewUser({ name: '', email: '', role: 'participant', location: 'US' });
                await refreshUsers();
            }
        } catch (err) {
            setError('Failed to add user');
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete "${userName}"?`)) return;

        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                setSuccess(`User "${userName}" deleted successfully!`);
                await refreshUsers();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const usersByLocation = REGIONS.reduce((acc, region) => {
        acc[region] = users.filter(u => u.location === region);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Add User Form */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-lg font-semibold mb-4">➕ Add New User</h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Full Name *"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        type="email"
                        placeholder="Email Address *"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="p-2 border rounded"
                    >
                        <option value="participant">Participant</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        value={newUser.location}
                        onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                        className="p-2 border rounded"
                    >
                        {REGIONS.map(region => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={addUser}
                    disabled={loading || !newUser.name.trim() || !newUser.email.trim()}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add User'}
                </button>
            </div>

            {/* Users by Location */}
            {REGIONS.map(region => (
                <div key={region} className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-semibold mb-4">
                        📍 {region} ({usersByLocation[region].length} users)
                    </h3>
                    {usersByLocation[region].length === 0 ? (
                        <p className="text-gray-500">No users in this region.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Role</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersByLocation[region].map(user => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{user.name}</td>
                                        <td className="p-2 text-gray-600">{user.email}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-2">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => deleteUser(user.id, user.name)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ✕ Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ))}
        </div>
    );
};

// Gifts Tab Component
const GiftsTab = ({ socket, appState, getUserName }) => {
    const [selectedRegion, setSelectedRegion] = React.useState('US');
    const [newGift, setNewGift] = React.useState({ name: '', amazonLink: '', imageUrl: '' });
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.imageUrl) {
                setNewGift(prev => ({ ...prev, imageUrl: data.imageUrl }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const addGift = () => {
        if (!newGift.name.trim()) return;
        socket.emit('admin_add_gift', { region: selectedRegion, gift: newGift });
        setNewGift({ name: '', amazonLink: '', imageUrl: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeGift = (giftId) => {
        if (confirm('Remove this gift?')) {
            socket.emit('admin_remove_gift', { region: selectedRegion, giftId });
        }
    };

    const regionGifts = appState.gifts?.inventory?.[selectedRegion] || [];
    const claims = appState.gifts?.claims || {};

    return (
        <div className="space-y-6">
            {/* Region Selector */}
            <div className="bg-white p-4 rounded shadow flex gap-2 flex-wrap">
                {REGIONS.map(region => (
                    <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`px-4 py-2 rounded font-medium transition ${selectedRegion === region
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                    >
                        {region} ({(appState.gifts?.inventory?.[region] || []).length})
                    </button>
                ))}
            </div>

            {/* Add Gift Form */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-lg font-semibold mb-4">➕ Add Gift to {selectedRegion}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Gift Name *"
                        value={newGift.name}
                        onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Amazon Link (optional)"
                        value={newGift.amazonLink}
                        onChange={(e) => setNewGift({ ...newGift, amazonLink: e.target.value })}
                        className="p-2 border rounded"
                    />
                </div>
                <div className="flex gap-4 items-center mb-4">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Upload Image</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="p-2 border rounded w-full"
                            disabled={uploading}
                        />
                    </div>
                    <div className="text-gray-400">OR</div>
                    <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Image URL</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={newGift.imageUrl}
                            onChange={(e) => setNewGift({ ...newGift, imageUrl: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                </div>
                {newGift.imageUrl && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Preview:</p>
                        <img src={newGift.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border" />
                    </div>
                )}
                <button
                    onClick={addGift}
                    disabled={!newGift.name.trim() || uploading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {uploading ? 'Uploading...' : 'Add Gift'}
                </button>
            </div>

            {/* Gift List */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-lg font-semibold mb-4">🎁 {selectedRegion} Gifts ({regionGifts.length})</h3>
                {regionGifts.length === 0 ? (
                    <p className="text-gray-500">No gifts added yet for {selectedRegion}.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Gift</th>
                                <th className="p-2">Link</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regionGifts.map(gift => (
                                <tr key={gift.id} className={`border-b ${gift.claimed ? 'bg-green-50' : ''}`}>
                                    <td className="p-2 font-medium">{gift.name}</td>
                                    <td className="p-2">
                                        {gift.amazonLink ? (
                                            <a href={gift.amazonLink} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline">View</a>
                                        ) : '-'}
                                    </td>
                                    <td className="p-2">
                                        {gift.claimed ? (
                                            <span className="text-green-600 font-medium">
                                                ✓ Claimed by {gift.claimedBy?.userName}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">Available</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {!gift.claimed && (
                                            <button
                                                onClick={() => removeGift(gift.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕ Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Claims Log */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-lg font-semibold mb-4">📋 All Claims</h3>
                {Object.keys(claims).length === 0 ? (
                    <p className="text-gray-500">No gifts claimed yet.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">User</th>
                                <th className="p-2">Gift</th>
                                <th className="p-2">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(claims).map(([userId, claim]) => (
                                <tr key={userId} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{getUserName(userId)}</td>
                                    <td className="p-2">{claim.giftName}</td>
                                    <td className="p-2">
                                        {claim.amazonLink ? (
                                            <a href={claim.amazonLink} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline">View</a>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { socket, appState } = useSocket();
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [newBingoItem, setNewBingoItem] = useState('');

    // Get unique active users by ID
    const getUniqueActiveUsers = () => {
        const sessions = Object.values(appState.activeSessions || {});
        const uniqueMap = new Map();
        sessions.forEach(user => {
            const id = typeof user === 'object' ? user.id : user;
            const name = typeof user === 'object' ? user.name : getUserName(user);
            if (!uniqueMap.has(id)) {
                uniqueMap.set(id, name);
            }
        });
        return Array.from(uniqueMap.values());
    };

    const setStage = (stage) => {
        socket.emit('admin_set_stage', stage);
    };

    const addBingoItem = () => {
        if (newBingoItem.trim()) {
            socket.emit('admin_add_bingo_item', newBingoItem.trim());
            setNewBingoItem('');
        }
    };

    const removeBingoItem = (item) => {
        if (confirm(`Delete "${item}"?`)) {
            socket.emit('admin_remove_bingo_item', item);
        }
    };

    const toggleBingoCall = (item) => {
        // If already called, maybe we don't want to un-call easily to prevent confusion, 
        // but for now let's just allow calling.
        if (!appState.bingo.calledItems.includes(item)) {
            socket.emit('bingo_call_item', item);
        }
    };

    if (!appState) return <div>Loading Admin...</div>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b border-gray-700">Admin Panel</div>
                <nav className="flex-1 p-4 space-y-2">
                    {['OVERVIEW', 'BINGO', 'GIFTS', 'SPIRIT WEAR', 'USERS'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    Connected: {Object.keys(appState.activeSessions || {}).length} Users
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">{activeTab}</h1>
                    <div className="bg-white px-4 py-2 rounded shadow flex items-center gap-2">
                        <span className="text-gray-500">Current Stage:</span>
                        <span className="font-bold text-blue-600">{appState.currentStage}</span>
                    </div>
                </div>

                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-xl font-semibold mb-4">Stage Control</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {STAGES.map(stage => (
                                        <button
                                            key={stage}
                                            onClick={() => setStage(stage)}
                                            className={`p-3 rounded text-sm font-medium transition ${appState.currentStage === stage
                                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                                <ul className="space-y-2">
                                    <li>Active Users: <span className="font-bold">{Object.keys(appState.activeSessions || {}).length}</span></li>
                                    <li>Bingo Winners: <span className="font-bold">{appState.bingo.winners.length}</span></li>
                                    <li>Gifts Claimed: <span className="font-bold">{Object.keys(appState.gifts?.claims || {}).length}</span></li>
                                    <li>Spirit Wear Contestants: <span className="font-bold">{appState.spiritWear.contestants.length}</span></li>
                                </ul>
                            </div>
                        </div>

                        {/* Active Users List */}
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">👥 Active Users ({getUniqueActiveUsers().length})</h2>
                            {getUniqueActiveUsers().length === 0 ? (
                                <p className="text-gray-400">No users currently connected.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {getUniqueActiveUsers().map((name, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-sm font-medium truncate">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reset Data Button */}
                        <div className="bg-red-50 border border-red-200 p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4 text-red-700">⚠️ Danger Zone</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Reset all game progress (Bingo calls/winners, Gift allocations, Spirit Wear votes).
                                Bingo questions and stage will be preserved.
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to reset all game data? This cannot be undone!')) {
                                        socket.emit('admin_reset_data');
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                            >
                                🔄 Reset Game Data
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'BINGO' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">Manage Questions ({appState.bingo.items?.length || 0})</h2>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newBingoItem}
                                    onChange={(e) => setNewBingoItem(e.target.value)}
                                    placeholder="Enter new 'Never Have I Ever' statement..."
                                    className="flex-1 p-2 border rounded"
                                    onKeyDown={(e) => e.key === 'Enter' && addBingoItem()}
                                />
                                <button onClick={addBingoItem} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add</button>
                            </div>
                            <div className="h-64 overflow-y-auto border rounded p-2 space-y-1 bg-gray-50">
                                {appState.bingo.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border hover:shadow-sm">
                                        <span>{item}</span>
                                        <button onClick={() => removeBingoItem(item)} className="text-red-500 hover:text-red-700 px-2">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">Call Numbers & Selections</h2>
                            <p className="text-sm text-gray-500 mb-2">Click to call out a statement. Names show who marked it.</p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {appState.bingo.items?.map((item, idx) => {
                                    const isCalled = appState.bingo.calledItems.includes(item);
                                    const selections = appState.bingo.selections?.[item] || [];
                                    return (
                                        <div key={idx} className={`p-3 border rounded transition ${isCalled ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`flex-1 ${isCalled ? 'font-bold text-green-700' : ''}`}>{item}</span>
                                                <button
                                                    onClick={() => toggleBingoCall(item)}
                                                    disabled={isCalled}
                                                    className={`ml-2 px-3 py-1 text-xs rounded ${isCalled
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                >
                                                    {isCalled ? 'Called' : 'Call'}
                                                </button>
                                            </div>
                                            {selections.length > 0 && (
                                                <div className="mt-2 text-xs text-gray-600">
                                                    <span className="font-medium">Marked by: </span>
                                                    {selections.map(u => u.name).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Prize Winners */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded shadow border border-yellow-200">
                            <h2 className="text-xl font-semibold mb-4">🏆 Prize Winners</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg ${appState.bingo.prizes?.rowColDiag ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-100'}`}>
                                    <div className="text-2xl mb-2">🎒</div>
                                    <div className="font-bold text-lg">Backpack</div>
                                    <div className="text-sm text-gray-600">(Row/Column/Diagonal)</div>
                                    {appState.bingo.prizes?.rowColDiag ? (
                                        <div className="mt-2 font-bold text-green-700">{appState.bingo.prizes.rowColDiag.name}</div>
                                    ) : (
                                        <div className="mt-2 text-gray-400">Not claimed yet</div>
                                    )}
                                </div>
                                <div className={`p-4 rounded-lg ${appState.bingo.prizes?.xPattern ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-100'}`}>
                                    <div className="text-2xl mb-2">🎧</div>
                                    <div className="font-bold text-lg">Headphone</div>
                                    <div className="text-sm text-gray-600">(X Pattern - Game Ends)</div>
                                    {appState.bingo.prizes?.xPattern ? (
                                        <div className="mt-2 font-bold text-green-700">{appState.bingo.prizes.xPattern.name}</div>
                                    ) : (
                                        <div className="mt-2 text-gray-400">Not claimed yet</div>
                                    )}
                                </div>
                            </div>
                            {appState.bingo.prizes?.xPattern && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center font-bold text-red-700">
                                    🏁 GAME OVER - All prizes claimed!
                                </div>
                            )}
                        </div>

                        {/* Registered Players */}
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">📋 Registered Bingo Cards ({Object.keys(appState.bingo.userCards || {}).length})</h2>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(appState.bingo.userCards || {}).map((card, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {card.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'GIFTS' && (
                    <GiftsTab socket={socket} appState={appState} getUserName={getUserName} />
                )}

                {activeTab === 'SPIRIT WEAR' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">Contestants</h2>
                            <ul className="space-y-2">
                                {appState.spiritWear.contestants.map(c => (
                                    <li key={c.id} className="flex items-center gap-2 p-2 border rounded">
                                        <span className="text-2xl">👕</span>
                                        <span>{c.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded shadow">
                            <h2 className="text-xl font-semibold mb-4">📊 Votes</h2>
                            <div className="space-y-2">
                                {Object.entries(appState.spiritWear.votes)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([id, count]) => (
                                        <div key={id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="font-medium">{getUserName(id)}</span>
                                            <span className="font-bold text-xl text-blue-600">{count}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'USERS' && (
                    <UsersTab />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
