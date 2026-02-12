const axios = require('axios');

const API_KEY = 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5';
const BASE_URL = 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app';

async function fetchInvestors() {
    try {
        const response = await axios.get(`${BASE_URL}/api/investors/get_all_investors?page=1&size=1`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            }
        });
        console.log('Response Keys:', Object.keys(response.data));
        if (response.data.data && response.data.data.length > 0) {
            console.log('First Investor:', JSON.stringify(response.data.data[0], null, 2));
        } else if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('First Investor:', JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('Full Response:', JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
}

fetchInvestors();
