const fs = require('fs');
const express = require('express');
const app = express();

// Route to serve the latest JSON data
app.get('/read-json', function (request, response) {
    try {
        // Synchronously read and parse the JSON file
        const json = JSON.parse(fs.readFileSync('./read.json', 'utf8'));
        response.send(json);
    } catch (error) {
        // Handle any errors that may occur during file reading or parsing
        console.error('Error reading or parsing the JSON file:', error);
        response.status(500).send({ error: 'Failed to load JSON data' });
    }
});

// Start the server (if needed)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

