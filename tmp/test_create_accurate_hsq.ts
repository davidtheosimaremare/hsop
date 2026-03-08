import { createAccurateHSQ, fetchAllCustomers } from "../src/lib/accurate";

async function main() {
    console.log("Testing createAccurateHSQ...");

    // Fetch a valid customer first
    const customers = await fetchAllCustomers();
    const validCustomerNo = customers.length > 0 ? customers[0].no : "UNKNOWN";
    console.log(`Using valid customerNo: ${validCustomerNo} (${customers[0]?.name})`);

    const mockQuotation = {
        quotationNo: "MOCK-HRSQ-" + Date.now(),
        customer: {
            accurateNo: validCustomerNo,
        },
        items: [
            {
                productSku: "3WA1110-3AB32-0AA0",
                price: 70626500,
                basePrice: 87938085,
                quantity: 1,
                productName: "SIEMENS ACB, 3WA, 3P, 1000A, 66kA, D/O, ETU300-LSI"
            }
        ]
    };

    try {
        const res = await createAccurateHSQ(mockQuotation);
        console.log("Result:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
