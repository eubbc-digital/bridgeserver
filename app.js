const express = require('express'),
  app = express(),
  port = 3000;

const fetch = require("node-fetch");
require('dotenv').config();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
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
    try {
      var response_booking_api= await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (!response_booking_api.ok) {
        throw new Error('Error fetching data');
      }

      response_booking_api = await response_booking_api.json();
      if (response_booking_api.length){
        response = {
          public: public,
          endDate: response_booking_api[0].end_date
        }
      }
      res.json(response);
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

app.listen(port, () => {
  console.log('Server is running on port localhost:3000');
});

