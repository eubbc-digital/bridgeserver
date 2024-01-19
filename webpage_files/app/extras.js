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
      window.location.href = window.location.origin + '/usp-lab/alert_page.html';
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
      window.location.href = window.location.origin + '/usp-lab/alert_page.html';
    }
  } else {
    window.location.href = window.location.origin + '/usp-lab/alert_page.html';
  }
}

async function handleFileDownload() {
  try {
    const response = await fetch('/usp-lab/download-files');
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

function initializeVideoStream(url) {
  var canvas = document.getElementById('video-canvas');
  var modalCanvas = document.getElementById('modal-video-canvas');
  var player = new JSMpeg.Player(url, { canvas: modalCanvas });

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

  const url = 'wss://eubbc-digital.upb.edu/usp-lab/camera/';
  initializeVideoStream(url)
}

document.addEventListener('DOMContentLoaded', init);
