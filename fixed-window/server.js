const http = require('http');

// =======================
// Rate Limiter Settings
// =======================
const rateLimitWindow = 60 * 1000; // Time window: 1 minute
const maxRequests = 5;             // Maximum allowed requests per IP within the time window
const ipRequests = {};             // Object to track requests per IP: { ip: { count, startTime } }

/**
 * -----------------------------
 * Simple Fixed-Window Rate Limiter
 * -----------------------------
 * Logic:
 * - Each IP address gets a fixed 1-minute window.
 * - If the IP makes more than `maxRequests` within that window → block it.
 * - When the window expires, the counter resets.
 */
const rateLimitMiddleware = (req, res) => {
    const ip = req.socket.remoteAddress; // Get client IP address
    const currentTime = Date.now();      // Current timestamp

    // If IP is seen for the first time, initialize its tracking info
    if (!ipRequests[ip]) {
        ipRequests[ip] = {
            count: 1,
            startTime: currentTime,
        };
    }
    else {
        // If still within the same time window
        if (currentTime - ipRequests[ip].startTime < rateLimitWindow) {
            ipRequests[ip].count += 1; // Increase the request count
        }
        else {
            // If window has expired → reset counter and start a new window
            ipRequests[ip] = {
                count: 1,
                startTime: currentTime,
            };
        }
    }

    // =======================
    // Check Rate Limit Status
    // =======================
    if (ipRequests[ip].count > maxRequests) {
        // Too many requests from this IP → block it
        res.writeHead(429, { 'Content-Type': 'text/plain' }); // 429 = Too Many Requests
        res.end('Too Many Requests. Please try again later.');
        return false; // Stop request handling
    }

    // Request allowed → continue
    return true;
};

// =======================
// HTTP Server Setup
// =======================
const server = http.createServer((req, res) => {
    // Apply rate limiting before handling the request
    if (!rateLimitMiddleware(req, res)) return;

    // Handle successful requests
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Passed \tDate: ${new Date().toISOString()}\n`);
});

// =======================
// Start the Server
// =======================
server.listen(3000, () => {
    console.log('🚀 Server running at http://localhost:3000');
});
