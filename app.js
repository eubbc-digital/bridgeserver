const express = require('express'),
  app = express(),
  port = parseInt(process.env.PORT,10) || 3000;

const fetch = require("node-fetch");
require('dotenv').config();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static('public/', {
  defaultFiles: ['vnc.html'],
}));

function validateReferer(req, res, next){
  const referer = req.get('referer');
  const allowedReferer = process.env.REFERER + ':' + process.env.BRIDGE_PORT;

  if (referer && referer.startsWith(allowedReferer)){
    next();
  } else{
    res.status(403).send('Forbidden')
  }
}

// Proxy route to forward the API request
app.get('/api/credentials', validateReferer, (req, res) => {
  const response = {
    password: process.env.PASSWORD,
    viewOnlyPassword: process.env.VIEW_ONLY_PASSWORD,
    bookingUrl: process.env.BOOKING_URL
  }
  res.json(response);
});

app.post('/api/bookingValidation', async (req, res) => {
  var body = req.body;
  const accessKey = body.bookingAccessKey;
  const pwd = body.bookingPwd;
  const bookingUrl = process.env.BOOKING_URL;

  var public = false;
  var response = {};

  if (accessKey != null) {
    var url =`${bookingUrl}api/reservation/?access_key=${accessKey}`;
    if (pwd != null) {
      url = `${url}&pwd=${pwd}`;
    } else {
      public = true;
    }
    const response_booking_api = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    const data = await response_booking_api.json();
    if (data.length){
      response = {
        public: public,
        endDate: data[0].end_date
      }
    }
  }
  res.json(response);
});

// Start the server
app.listen(port, () => {
  console.log('Server is running on port localhost:3000');
});

