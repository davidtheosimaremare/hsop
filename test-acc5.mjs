import fs from 'fs';
import crypto from 'crypto';

const env = fs.readFileSync('.env', 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2];
});

const secretKey = envVars.ACCURATE_SECRET_KEY;
const bearerToken = envVars.ACCURATE_BEARER_TOKEN;
const host = envVars.ACCURATE_API_HOST || "https://zeus.accurate.id";

function generateHmacSignature(message) {
    return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

const now = new Date();
const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});
const parts = formatter.formatToParts(now);
const getPart = (type) => parts.find(p => p.type === type)?.value || "";
const timestamp = `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

const signatureBase64 = generateHmacSignature(timestamp);

const headers = {
    'Authorization': `Bearer ${bearerToken}`,
    'X-Api-Signature': signatureBase64,
    'X-Api-Timestamp': timestamp,
    'Content-Type': 'application/json',
};

const url = new URL(`${host}/accurate/api/customer/list.do`);
url.searchParams.append('fields', 'id,no,customerNo,name');
url.searchParams.append('sp.pageSize', '2');

fetch(url.toString(), { headers })
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
