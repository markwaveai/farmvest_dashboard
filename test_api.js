const axios = require('axios');

const url1 = 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app/api/farm/locations';
const url2 = 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app//api/farm/locations'; // Double slash
const apiKey = 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5';

async function test(url) {
    try {
        console.log(`Testing ${url}...`);
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Status: ${response.status}`);
        console.log(`Data:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error(`Error testing ${url}:`, error.message);
        if (error.response) {
            console.error(`Response Data:`, error.response.data);
        }
    }
}

async function run() {
    await test(url1);
    await test(url2);
}

run();
