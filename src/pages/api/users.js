import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const usersFilePath = path.join(process.cwd(), 'users.json');

    if (req.method === 'GET') {
        try {
            const data = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(data);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read users' });
        }
    } else if (req.method === 'POST') {
        try {
            const { name, email, role, location } = req.body;

            if (!name || !email || !location) {
                return res.status(400).json({ error: 'Name, email, and location are required' });
            }

            const data = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(data);

            // Check if email already exists
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                return res.status(400).json({ error: 'A user with this email already exists' });
            }

            // Generate new ID based on location and count
            const locationPrefix = location === 'India' ? 'in' :
                location === 'UK' ? 'uk' :
                    location === 'UAE' ? 'uae' :
                        location === 'Lebanon' ? 'lb' : 'us';
            const locationUsers = users.filter(u => u.location === location && !u.id.startsWith('admin'));
            const newId = `${locationPrefix}_${locationUsers.length + 1}`;

            // Create new user
            const newUser = {
                id: newId,
                name,
                email,
                role: role || 'participant',
                location
            };

            users.push(newUser);

            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error adding user:', error);
            res.status(500).json({ error: 'Failed to add user' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const data = fs.readFileSync(usersFilePath, 'utf8');
            let users = JSON.parse(data);

            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Remove user
            users = users.filter(u => u.id !== userId);

            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
