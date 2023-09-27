/*
Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
MIT License - See LICENSE file in the root directory
Boris Pedraza, Alex Villazon
*/

const express = require('express');
const app = express();
require('dotenv').config();

// Serve static files from the public directory
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
// Proxy route to forward the API request
app.get('/api/credentials', validateReferer, (req, res) => {
  const response = {
    password: process.env.PASSWORD,
    view_only_password: process.env.VIEW_ONLY_PASSWORD,
    booking_url: process.env.BOOKING_URL,
  }
  res.json(response);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port localhost:3000');
});

