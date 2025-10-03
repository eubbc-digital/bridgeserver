const Stream = require('node-rtsp-stream');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const multer = require('multer');
require('dotenv').config();

app.use(express.static('public/', {
  defaultFiles: ['vnc.html'],
}));

const cameraUrls = [
  process.env.CAMERA1_URL,
  process.env.CAMERA2_URL, 
  process.env.CAMERA3_URL
];
const cameraPorts = [
  process.env.CAMERA1_WS_PORT,
  process.env.CAMERA2_WS_PORT,
  process.env.CAMERA3_WS_PORT
];

function createStream(url, port) {
  return new Stream({
    streamUrl: url,
    wsPort: port,
    ffmpegOptions: {
      '-stats': '',
      '-f': 'mpegts',
      '-codec:v': 'mpeg1video',
      '-s': '640x360',
      '-b:v': '700k',
      '-r': '25',
      '-bf': '0',
      '-codec:a': 'mp2',
      '-ar': '44100',
      '-ac': '1',
      '-b:a': '64k',
      '-analyzeduration': '100M',
      '-probesize': '100M',
    }
  });
}

let streams = cameraUrls.map((url, index) => {
  const stream = createStream(url, cameraPorts[index]);
  
  stream.on('start', () => {
    console.log(`Stream ${index + 1} started`);
  });

  stream.on('error', (err) => {
    console.error(`Stream ${index + 1} error:`, err);
    if (err.code === 'ECONNRESET') {
      console.log(`Restarting stream ${index + 1}`);
      streams[index].stop();
      streams[index] = createStream(url, cameraPorts[index]);
    }
  });

  return stream;
});

setInterval(() => {
  console.log('Restarting all streams');
  streams.forEach((s, index) => {
    s.stop();
    streams[index] = createStream(cameraUrls[index], cameraPorts[index]);
  });
}, 1 * 60 * 60 * 1000);

function validateReferer(req, res, next){
  const referer = req.get('referer');
  const allowedReferer = process.env.REFERER;

  if (referer && referer.startsWith(allowedReferer)){
    next();
  } else{
    res.status(403).send('Forbidden')
  }
}

app.get('/api/credentials', validateReferer, (req, res) => {
  const response = {
    password: process.env.PASSWORD,
    view_only_password: process.env.VIEW_ONLY_PASSWORD,
    booking_url: process.env.BOOKING_URL,
  }
  res.json(response);
});

app.get('/download-files', (req, res) => {
  const directoryToServe = '/app/lab_files';
  const zipFileName = 'lab_files.zip';

  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  archive.pipe(res);

  fs.readdir(directoryToServe, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading directory');
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryToServe, file);
      archive.file(filePath, { name: file });
    });

    archive.finalize();
  });

  res.attachment(zipFileName);
});

const uploadDir = '/app/lab_files';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.py' || ext === '.ipynb') {
      cb(null, true);
    } else {
      cb(new Error('Only .py and .ipynb files are allowed'));
    }
  },
  limits: { files: 20 }
});

app.post('/upload-file', upload.any(), (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const filenames = files.map(f => f.filename);
  return res.json({ success: true, message: 'File(s) uploaded successfully', filenames });
});

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
  }
  next();
});

app.listen(3002, () => {
  console.log('Server is running on port localhost:3002');
});
