import { config } from 'dotenv';
config();
import { generateAccurateAuthHeaders } from './src/lib/accurate';

async function test() {
  const headers = await generateAccurateAuthHeaders();
  const endpoint = `${process.env.ACCURATE_API_HOST || "https://zeus.accurate.id"}/accurate/api/sales-quotation/list.do`;
  
  // We can query with fields=number and sort by number desc
  const url = new URL(endpoint);
  url.searchParams.append('fields', 'number');
  
  // Actually, wait, let's see how Accurate list API handles sorting.
  // We can just fetch the first page, sorted by id desc or number desc.
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers
  });
  
  const res = await response.json();
  console.log("Accurate SQ List:", res.d?.slice(0, 5));
}

test().catch(console.error);
