const express = require('express');
const app = express();
require('dotenv').config();

// Serve static files from the public directory
app.use(express.static('public/', {
  defaultFiles: ['vnc.html'],
}));

// Proxy route to forward the API request
app.get('/api/credentials', async (req, res) => {
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

