const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
require('dotenv').config();

app.use(express.static('public/', {
  defaultFiles: ['vnc.html'],
}));

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

app.listen(3002, () => {
  console.log('Server is running on port localhost:3002');
});

