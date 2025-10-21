const http = require('http');

// Helper function to send a request to the local server
function makeRequest() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000/', (res) => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data.trim() });
            });
        });

        req.on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

// Test function to simulate multiple requests
async function test() {
    console.log('🚦 Starting Rate Limiter Test...\n');
    console.log('---------------------------------------------');
    console.log(`Target: http://localhost:3000/`);
    console.log(`Total Requests: 7`);
    console.log(`Rate Limit: 5 requests per minute`);
    console.log('---------------------------------------------\n');

    for (let i = 1; i <= 7; i++) {
        const startTime = Date.now();
        const result = await makeRequest();
        const duration = Date.now() - startTime;

        if (result.error) {
            console.log(`❌ Request ${i} FAILED: ${result.error}`);
        } else if (result.status === 429) {
            console.log(
                `🚫 Request ${i} BLOCKED (Status: ${result.status}) → ${result.body}`
            );
        } else {
            console.log(
                `✅ Request ${i} SUCCESS (Status: ${result.status}) → ${result.body}`
            );
        }

        console.log(`   ⏱ Response Time: ${duration}ms\n`);

        // Small delay between requests to simulate real-world traffic
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('---------------------------------------------');
    console.log('🧪 Test Completed.');
    console.log('---------------------------------------------\n');
}

// Run the test
test();
