import { searchAccurateCustomers } from './src/lib/accurate';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const res = await searchAccurateCustomers('Puramayungan');
    console.log(res);
}

main().catch(console.error);
