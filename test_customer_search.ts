import { config } from 'dotenv';
config();
import { searchAccurateCustomers } from './src/lib/accurate';
async function run() {
  const res3 = await searchAccurateCustomers("CV.");
  console.log("Found CV.:", res3.length, res3.map(r => r.name));
}
run();
