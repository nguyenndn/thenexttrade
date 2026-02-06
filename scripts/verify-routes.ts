
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const routes = [
    '/',
    '/library',
    '/academy',
    '/dashboard',
    '/admin',
    '/articles',  // Should redirect or exist
    '/login',
    '/register'
];

async function verifyRoutes() {
    console.log(`🚀 Starting Route Verification on ${BASE_URL}...\n`);

    let hasError = false;

    for (const route of routes) {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${BASE_URL}${route}`, {
                validateStatus: (status) => status < 500, // Accept anything not 500 level effectively, but we want 200 mostly
            });
            const duration = Date.now() - startTime;

            if (response.status === 200) {
                console.log(`✅ [200 OK] ${route} (${duration}ms)`);
            } else if (response.status >= 300 && response.status < 400) {
                console.log(`⚠️ [${response.status} REDIRECT] ${route} (${duration}ms)`);
            } else if (response.status === 404) {
                console.log(`⚠️ [404 NOT FOUND] ${route} (${duration}ms) - Check if this is expected`);
            } else {
                console.log(`❌ [${response.status} ERROR] ${route} (${duration}ms)`);
                hasError = true;
            }
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.error(`❌ Connection refused at ${BASE_URL}. Is the server running?`);
                process.exit(1);
            }
            console.error(`❌ [FAILED] ${route}: ${error.message}`);
            hasError = true;
        }
    }

    console.log('\n-----------------------------------');
    if (hasError) {
        console.error('❌ Verification FAILED. Some routes are not healthy.');
        process.exit(1);
    } else {
        console.log('✅ All routes verified successfully.');
    }
}

verifyRoutes();
