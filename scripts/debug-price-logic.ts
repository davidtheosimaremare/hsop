import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkLogic() {
    const sku = "3RV2901-1E";
    const product = await db.product.findUnique({
        where: { sku }
    });

    if (!product) {
        console.log("Product not found");
        return;
    }

    console.log(`Product: ${product.name}`);
    console.log(`Category: '${product.category}'`);
    console.log(`Stock: ${product.availableToSell}`);

    const mapping = await db.categoryMapping.findFirst({
        where: { categoryName: product.category || "" }
    });

    if (mapping) {
        console.log(`Mapped to Group: '${mapping.discountType}'`);
        const rule = await db.discountRule.findUnique({
            where: { categoryGroup: mapping.discountType }
        });
        console.log(`Rule for ${mapping.discountType}: Stock="${rule?.stockDiscount}", Indent="${rule?.indentDiscount}"`);
    } else {
        console.log("No Category Mapping found!");
    }
}

checkLogic()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
