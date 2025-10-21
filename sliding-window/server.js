const http = require('http');

// Configuration
const rateLimitWindowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = 5;
const ipRequests = {}; // Store timestamps per IP: { 'ip': [timestamp1, timestamp2, ...] }

/**
 * Sliding Window Rate Limiter
 * ----------------------------------
 * The sliding window algorithm continuously tracks requests within a moving time window.
 * For each request:
 *   1. Remove timestamps older than the current window.
 *   2. Count how many requests remain (still within the window).
 *   3. If the count >= limit → block the request.
 *   4. Otherwise, allow it and record the timestamp.
 */
const rateLimitMiddleware = (req, res) => {
    const ip = req.socket.remoteAddress; // Identify user by IP
    const currentTime = Date.now();

    // Initialize request history for this IP if it doesn't exist
    if (!ipRequests[ip]) {
        ipRequests[ip] = [];
    }

    // Remove timestamps that fall outside the sliding window
    ipRequests[ip] = ipRequests[ip].filter(timestamp => {
        return currentTime - timestamp < rateLimitWindowMs;
    });

    // Calculate the number of requests within the window
    const requestCount = ipRequests[ip].length; // 0 base count

    // If request count exceeds or equals the allowed limit, reject the request
    if (requestCount >= maxRequestsPerWindow) {
        const retryAfter = Math.ceil(
            (rateLimitWindowMs - (currentTime - ipRequests[ip][0])) / 1000
        ); // Calculate seconds until user can retry

        res.statusCode = 429; // Too Many Requests
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Retry-After', retryAfter); // Standard header for rate limits
        res.end(`Too many requests. Try again in ${retryAfter} seconds.`);
        return false;
    }

    // Otherwise, allow the request and record the timestamp
    ipRequests[ip].push(currentTime);
    return true;
};

// Create HTTP server
const server = http.createServer((req, res) => {
    if (!rateLimitMiddleware(req, res)) return; // Apply rate limiting before handling request

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, world!');
});

// Start the server
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
