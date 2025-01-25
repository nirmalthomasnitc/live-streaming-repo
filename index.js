const express = require('express');
const app = express();
const path = require('path');



// Serve the HLS files
app.use('/hls', express.static(path.join(__dirname, '/')));


// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'viewer_client.html'));
});

const PORT = 3700;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
