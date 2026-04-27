// test-config.js - Quick test to verify config endpoint works
require('dotenv').config();

const SERVER_IP = process.env.SERVER_IP || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || '3001';

console.log('\n🧪 Testing Configuration Setup...\n');
console.log('Environment Variables:');
console.log('─────────────────────────────────');
console.log(`SERVER_IP: ${SERVER_IP}`);
console.log(`SERVER_PORT: ${SERVER_PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('─────────────────────────────────\n');

// Test fetch config
const testFetch = async () => {
    try {
        const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/config`);
        const config = await response.json();
        
        console.log('✅ Config endpoint working!');
        console.log('\nConfig Response:');
        console.log(JSON.stringify(config, null, 2));
        console.log('\n✨ All tests passed!\n');
    } catch (error) {
        console.error('❌ Config endpoint failed:', error.message);
        console.log('\n⚠️  Make sure the server is running with: npm run start:web\n');
    }
};

// Run test
setTimeout(() => {
    testFetch();
}, 1000);
