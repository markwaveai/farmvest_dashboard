// const https = require('https');

// const apiKey = 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5';
// const baseUrl = 'https://farmvest-stagging-services-612299373064.asia-south1.run.app';

// function request(path) {
//     return new Promise((resolve, reject) => {
//         const options = {
//             hostname: 'farmvest-stagging-services-612299373064.asia-south1.run.app',
//             path: path,
//             method: 'GET',
//             headers: {
//                 'Authorization': apiKey,
//                 'Content-Type': 'application/json'
//             }
//         };

//         const req = https.request(options, (res) => {
//             let data = '';
//             res.on('data', (chunk) => data += chunk);
//             res.on('end', () => {
//                 try {
//                     const parsed = JSON.parse(data);
//                     resolve({ status: res.statusCode, data: parsed });
//                 } catch (e) {
//                     resolve({ status: res.statusCode, data: data });
//                 }
//             });
//         });

//         req.on('error', (e) => reject(e));
//         req.end();
//     });
// }

// async function run() {
//     console.log("Testing get_total_animals...");
//     try {
//         const res1 = await request('/api/animal/get_total_animals?page=1&size=5');
//         console.log("Status:", res1.status);
//     } catch (e) { console.error(e); }

//     console.log("\nTesting get_all_animals...");
//     try {
//         const res2 = await request('/api/animal/get_all_animals?page=1&size=5');
//         console.log("Status:", res2.status);
//     } catch (e) { console.error(e); }
// }

// run();
