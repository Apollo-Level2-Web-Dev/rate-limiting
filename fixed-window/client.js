const http = require('http');

// Function to send a single HTTP request
function makeRequest() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data.trim() }));
        });

        req.on('error', (err) => resolve({ error: err.message }));
    });
}

// Function to test the rate limiter behavior
async function test() {
    console.log('🚦 Starting rate limiter test...\n');
    console.log('----------------------------------------');
    console.log(`Sending 7 requests to http://localhost:3000/`);
    console.log(`Rate limit: 5 requests per minute`);
    console.log('----------------------------------------\n');

    for (let i = 1; i <= 20; i++) {
        const start = Date.now();
        const result = await makeRequest();
        const duration = Date.now() - start;

        if (result.error) {
            console.log(`❌ Request ${i} failed: ${result.error}`);
        } else if (result.status === 429) {
            console.log(`🚫 Request ${i}: BLOCKED (${result.status}) - ${result.body}`);
        } else {
            console.log(`✅ Request ${i}: ALLOWED (${result.status}) - ${result.body}`);
        }

        console.log(`   ⏱ Response time: ${duration}ms\n`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Add short delay between requests
    }

    console.log('----------------------------------------');
    console.log('🧪 Test completed.');
}

test();
