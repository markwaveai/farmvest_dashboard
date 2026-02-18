const axios = require('axios');

const API_KEY = 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5';
const BASE_URL = 'https://farmvest-stagging-services-612299373064.asia-south1.run.app';

async function checkTicketResponse() {
    try {
        console.log('Fetching tickets (size=50)...');
        const response = await axios.get(`${BASE_URL}/api/ticket/get_health_tickets?page=1&size=50`, {
            headers: {
                'Authorization': API_KEY, // Sending raw API key
                'Content-Type': 'application/json'
            }
        });

        console.log('Response Keys:', Object.keys(response.data));

        if (response.data.counts) {
            console.log('Counts Structure:', JSON.stringify(response.data.counts, null, 2));
        } else {
            // Check for root-level status counts
            const statusKeys = Object.keys(response.data).filter(k => k.toLowerCase().includes('count') || k.toLowerCase().includes('total'));
            console.log('Potential Count Keys at Root:', statusKeys);
            statusKeys.forEach(k => console.log(`  ${k}: ${response.data[k]}`));
        }

        const tickets = response.data.data || response.data.health_tickets || response.data.tickets || [];
        console.log('Tickets Found:', Array.isArray(tickets) ? tickets.length : 'NOT AN ARRAY');

        if (Array.isArray(tickets) && tickets.length > 0) {
            const statuses = [...new Set(tickets.map(t => t.status))];
            console.log('Unique status values in table:', statuses);

            const inProgress = tickets.filter(t => String(t.status || '').toUpperCase().includes('PROGRESS'));
            console.log('Tickets with "PROGRESS" in status:', inProgress.length);
            if (inProgress.length > 0) console.log('Sample In-Progress Ticket Status:', inProgress[0].status);

            const resolved = tickets.filter(t => ['RESOLVED', 'COMPLETED', 'APPROVED'].includes(String(t.status || '').toUpperCase()));
            console.log('Tickets with "RESOLVED/COMPLETED/APPROVED" in status:', resolved.length);
            if (resolved.length > 0) console.log('Sample Completed Ticket Status:', resolved[0].status);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.log('Error Response Data:', error.response.data);
    }
}

checkTicketResponse();
