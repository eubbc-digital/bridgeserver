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

function loadCamerasFromEnv() {
  const raw = process.env.CAMERAS;
  if (!raw) {
    console.error('CAMERAS env var is required. Example: CAMERAS=[{"url":"rtsp://...","wsPort":8011}]');
    process.exit(1);
  }
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse CAMERAS JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(arr) || arr.length === 0) {
    console.error('CAMERAS must be a non-empty JSON array.');
    process.exit(1);
  }
  const normalized = arr
    .map((c, i) => ({ url: c && c.url, wsPort: Number(c && c.wsPort), _idx: i }))
    .filter(c => typeof c.url === 'string' && c.url.length > 0 && Number.isFinite(c.wsPort));
  if (normalized.length !== arr.length) {
    console.error('Invalid CAMERAS entries found (missing url or wsPort). Please fix the configuration.');
    process.exit(1);
  }
  return normalized;
}

const cameras = loadCamerasFromEnv();

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

const WATCHDOG_TIMEOUT_MS = Number(process.env.STREAM_WATCHDOG_TIMEOUT_MS || 10000); // 10s without frames -> restart
const WATCHDOG_CHECK_MS = Number(process.env.STREAM_WATCHDOG_CHECK_MS || 3000); // check every 3s
const WATCHDOG_MAX_BACKOFF_MS = Number(process.env.STREAM_WATCHDOG_MAX_BACKOFF_MS || 60000); // cap backoff at 60s

let streams = [];
const monitors = cameras.map(() => ({ lastData: Date.now(), timer: null, backoff: 1000, scheduled: false }));

function scheduleRestart(index, reason) {
  const monitor = monitors[index];
  if (!monitor) return;
  if (monitor.scheduled) return;
  const delay = monitor.backoff || 1000;
  monitor.scheduled = true;
  console.warn(`Scheduling restart for stream ${index + 1} in ${Math.round(delay / 1000)}s due to: ${reason}`);
  setTimeout(() => {
    monitor.scheduled = false;
    restartStream(index, reason);
    monitor.backoff = Math.min((monitor.backoff || 1000) * 2, WATCHDOG_MAX_BACKOFF_MS);
  }, delay);
}

function setupStream(index) {
  const cam = cameras[index];
  const stream = createStream(cam.url, cam.wsPort);

  const monitor = monitors[index];
  const markData = () => {
    monitor.lastData = Date.now();
    monitor.backoff = 1000; 
  };

  stream.on('start', () => {
    console.log(`Stream ${index + 1} started (ws:${cam.wsPort})`);
    markData();
  });

  ['camdata', 'mpeg1data', 'data'].forEach((evt) => {
    try { stream.on(evt, markData); } catch (_) {}
  });

  stream.on('error', (err) => {
    console.error(`Stream ${index + 1} error (ws:${cam.wsPort}):`, err);
    scheduleRestart(index, err && err.code ? `error:${err.code}` : 'error');
  });

  if (monitor.timer) clearInterval(monitor.timer);
  monitor.timer = setInterval(() => {
    const idleMs = Date.now() - monitor.lastData;
    if (idleMs > WATCHDOG_TIMEOUT_MS) {
      console.warn(`Watchdog: no video data for ${Math.round(idleMs / 1000)}s on stream ${index + 1} (ws:${cam.wsPort}).`);
      scheduleRestart(index, `watchdog idle ${idleMs}ms`);
    }
  }, WATCHDOG_CHECK_MS);

  return stream;
}

function restartStream(index, reason) {
  const cam = cameras[index];
  const prev = streams[index];
  console.log(`Restarting stream ${index + 1} (ws:${cam.wsPort}) due to: ${reason}`);
  try {
    if (prev) {
      try { prev.removeAllListeners && prev.removeAllListeners(); } catch (_) {}
      try { prev.stop && prev.stop(); } catch (_) {}
    }
  } catch (_) {}
  setTimeout(() => {
    streams[index] = setupStream(index);
  }, 200);
}

streams = cameras.map((_, index) => setupStream(index));

setInterval(() => {
  if (!streams.length) return;
  console.log('Restarting all streams');
  streams.forEach((s, index) => {
    const cam = cameras[index];
    if (cam) {
      scheduleRestart(index, 'periodic refresh');
    }
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

app.get('/api/cameras', validateReferer, (req, res) => {
  res.json({ count: cameras.length });
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
