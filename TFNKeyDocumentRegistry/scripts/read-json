const fs = require('fs');
const express = require('express');
const app = express();

// Route to serve the latest JSON data
app.get('/read-json', function(request, response) {
    // Synchronously read and parse the JSON file each time the route is accessed
    const json = JSON.parse(fs.readFileSync('./read.json', 'utf8'));
    response.send(json);
});
