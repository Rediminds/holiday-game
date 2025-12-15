import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
        uploadDir,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    try {
        const [fields, files] = await form.parse(req);
        const file = files.image?.[0];

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate unique filename
        const ext = path.extname(file.originalFilename || '.jpg');
        const newFilename = `gift_${Date.now()}${ext}`;
        const newPath = path.join(uploadDir, newFilename);

        // Rename file to new path
        fs.renameSync(file.filepath, newPath);

        // Return the public URL
        const imageUrl = `/uploads/${newFilename}`;
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
}
