const axios = require('axios');

const BASE_URL = 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app';
const API_KEY = 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5';

const endpoints = [
    '/api/farm/create_farm',
    '/api/farm/farm',
    '/api/farm',
    '/api/farm/add_farm',
    '/api/farms/create',
    '/api/farms'
];

const fs = require('fs');

async function testCreateFarm() {
    console.log('--- Probing Create Farm Endpoints ---');
    const payload = {
        farm_name: "Test_Probe_Farm_" + Date.now(),
        location: "KURNOOL",
        farm_manager_name: "Probe Tester",
        mobile_number: "9999999999"
    };

    const results = [];

    for (const endpoint of endpoints) {
        console.log(`Testing POST ${endpoint}...`);
        try {
            const res = await axios.post(`${BASE_URL}${endpoint}`, payload, {
                headers: {
                    'Authorization': API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            results.push({ endpoint, status: res.status, success: true, data: res.data });
            console.log(`✅ SUCCESS: ${endpoint}`);
            break;
        } catch (err) {
            const status = err.response ? err.response.status : 'Network Error';
            results.push({ endpoint, status: status, success: false, detail: err.response?.data });
            console.log(`❌ FAILED: ${endpoint} -> ${status}`);
        }
    }
    fs.writeFileSync('debug_results.json', JSON.stringify(results, null, 2));
}

testCreateFarm();
