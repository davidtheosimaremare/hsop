import { PrismaClient, Prisma } from '@prisma/client';
const where: Prisma.ProductWhereInput = {};
const terms = ["a"];
where.AND = terms.map(term => ({
    OR: [
        { name: { contains: term, mode: "insensitive" as const } },
    ]
}));

const categoryNames = ["CP", "LV"];
const categoryConditions = categoryNames.map(name => ({
    category: { contains: name, mode: "insensitive" as const }
}));

where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : [])),
    { OR: categoryConditions }
];

console.log(JSON.stringify(where, null, 2));
