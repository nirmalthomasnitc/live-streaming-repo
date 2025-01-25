const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs')
const wss = new WebSocket.Server({ port: 3300 });
console.log('WebSocket server running on ws://localhost:3000');

// In-memory chunk storage (FIFO queue)
const chunkQueue = [];
const MAX_CHUNKS = 50; // Limit to avoid excessive memory usage
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    // Send existing chunks to the new client (to avoid empty playback)
    chunkQueue.forEach((chunk) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(chunk);
        }
    });

    // Remove disconnected clients
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(ws);
    });
});

// Broadcast incoming chunks to all connected clients
function broadcastChunk(chunk) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(chunk);
        }
    });
}

// Mock FFmpeg or video source for incoming data
const ffmpeg = spawn('ffmpeg', [
    '-i', 'pipe:0',                // Input from stdin
    '-re',
    '-g', '60',
    '-c:v', 'libx264',            // Video codec
    '-preset', 'veryfast',        // Encoding preset
    '-f', 'mpegts',               // Output as MPEG-TS chunks
    'pipe:1',                     // Output to stdout
]);

ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`);
});


ffmpeg.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);
});

// Simulate video input for FFmpeg
let reader = fs.createReadStream('video.mp4')

// Handle incoming chunks from FFmpeg stdout
reader.on('data', (chunk) => {
    // Add chunk to memory queue
    chunkQueue.push(chunk);
    if (chunkQueue.length > MAX_CHUNKS) {
        chunkQueue.shift(); // Remove oldest chunk to prevent memory overflow
    }

    // Broadcast chunk to all connected clients
    // broadcastChunk(chunk);
});
reader.on('close', () => {
    console.log('Video source closed');
});
