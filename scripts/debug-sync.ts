
import { syncProductsAction } from "@/app/actions/product";

async function main() {
    console.log("Running sync debug...");
    const result = await syncProductsAction();
    console.log("Result:", result);
}

main().catch(console.error);
