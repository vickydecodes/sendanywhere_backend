// app.mjs
import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://sendanywhere-clone.onrender.com',
}));

const port = process.env.PORT || 'http://localhost:3000'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: 'uploads/' })

const fileStore = {};

app.post('/upload', upload.single('file'), (req, res) => {
    const code = uuid().slice(0, 6); 
    fileStore[code] = {
        path: req.file.path,
        originalName: req.file.originalname,
        expires: Date.now() + 3600000 
    };
    console.log('Uploaded File:', fileStore[code]);
    res.json({ code });
});

app.get('/download/:code', (req, res) => {
    const { code } = req.params;
    const file = fileStore[code];

    console.log({ fileStore, file, code });
    console.log(req.params);

    if (!file || Date.now() > file.expires) {
        return res.status(404).send('File not found or expired');
    }

    res.json({
        code: code,
        fileUrl: `${port}/file/${code}`,
        originalName: file.originalName,
    });
});


app.get('/file/:code', (req, res) => {
    const { code } = req.params;
    const fileDetails = fileStore[code];

    if (!fileDetails || Date.now() > fileDetails.expires) {
        return res.status(404).send('File not found or expired');
    }

    res.download(fileDetails.path, fileDetails.originalName, (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Could not download the file.");
        }
    });
})
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
