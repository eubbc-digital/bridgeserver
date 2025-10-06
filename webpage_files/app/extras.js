/*
 Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
 MIT License - See LICENSE file in the root directory
 Boris Pedraza, Alex Villazon
*/
import UI from './ui.js';
import JSMpeg from './jsmpeg.min.js';

function timerControl(endDate) {
  var x = setInterval(function() {
    var now = new Date().getTime();
    var distance = endDate - now;
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("timer").innerHTML = `${hours}h : ${minutes}m : ${seconds}s`;

    if (distance < 0) {
      UI.disconnect();
      UI.accessPassword = null;
      clearInterval(x);
      document.getElementById("timer").innerHTML = "TIME COMPLETED";
      window.location.href = window.location.origin + '/robot-lab/alert_page.html';
    }
  }, 1000);
}

async function validateReservation(pwd, accessKey, credentialsData) {
  if (accessKey != null) {
    var url = `${credentialsData.booking_url}api/reservation/?access_key=${accessKey}`;
    if (pwd != null) {
      url = `${url}&pwd=${pwd}`;
      UI.accessPassword = credentialsData.password;
    } else {
      UI.accessPassword = credentialsData.view_only_password;
    }
    const response_booking_api = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    const data = await response_booking_api.json();
    if (data.length) {
      var end_date = new Date(data[0].end_date).getTime();
      timerControl(end_date);
    } else {
      UI.accessPassword = null;
      window.location.href = window.location.origin + '/robot-lab/alert_page.html';
    }
  } else {
    window.location.href = window.location.origin + '/robot-lab/alert_page.html';
  }
}

async function handleFileDownload() {
  try {
    const response = await fetch('/robot-lab/download-files');
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'lab_files.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }
    const response = await fetch('/robot-lab/upload-file', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Upload failed');
    }
    const result = await response.json();
    const list = Array.isArray(result.filenames) ? result.filenames.join('\n') : (result.filename || '');
    alert(`Upload completed:\n${list}`);
  } catch (error) {
    console.error('Upload error:', error);
    const msg = error?.message || 'Upload failed';
    alert(msg);
  }
}

function handleStreamError(canvas) {
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.font = '20px Arial';
  context.fillText('No input stream available', 50, 180);
}

async function initializeVideoStream() {
  let count = 0;
  try {
    const resp = await fetch('api/cameras');
    if (resp.ok) {
      const data = await resp.json();
      count = Number(data.count) || 0;
    }
  } catch (e) {
    console.warn('Could not fetch camera count, defaulting to 1:', e);
    count = 1;
  }

  const origin = window.location.origin.replace(/^http/, 'ws');
  const base = `${origin}/robot-lab`;
  const cameraGrid = document.getElementById('camera-grid');
  cameraGrid.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const container = document.createElement('div');
    container.className = 'camera-container';

    const canvas = document.createElement('canvas');
    canvas.id = `modal-video-canvas-${i + 1}`;
    canvas.width = 640;
    canvas.height = 360;

    const label = document.createElement('p');
    label.textContent = `Camera ${i + 1}`;

    container.appendChild(canvas);
    container.appendChild(label);
    cameraGrid.appendChild(container);

    const url = `${base}/camera${i + 1}/`;
    try {
      new JSMpeg.Player(url, { canvas });
    } catch (error) {
      console.error(`Error initializing video stream ${i + 1}:`, error);
      handleStreamError(canvas);
    }
  }

  var showStreamButton = document.getElementById('show-stream-button');
  var showStreamWrapperButton = document.getElementById('show-stream-wrapper-button');
  var videoModal = document.getElementById('video-modal');
  var closeModalButton = document.getElementById('close-modal-button');

  showStreamButton.addEventListener('click', function() {
    showStreamWrapperButton.style.display = 'none';
    videoModal.style.display = 'block';
  });

  closeModalButton.addEventListener('click', function() {
    videoModal.style.display = 'none';
    showStreamWrapperButton.style.display = 'block';
  });
}

async function init() {
  var credentialsData = await fetch('api/credentials');
  credentialsData = await credentialsData.json();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingAccessKey = urlParams.get('access_key');
  const bookingPwd = urlParams.get('pwd');
  validateReservation(bookingPwd, bookingAccessKey, credentialsData)

  const downloadButton = document.getElementById('download-button');
  downloadButton.addEventListener('click', handleFileDownload);

  const uploadButton = document.getElementById('upload-button');
  const fileInput = document.getElementById('file-input');
  uploadButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files));

  await initializeVideoStream();
}

document.addEventListener('DOMContentLoaded', init);
