import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
    const query = "ACB 3P 1000 Amp 65 kA 220 V";
    
    let normalizedQuery = query.toLowerCase()
        .replace(/(\d+)\s*-\s*poles?/g, "$1p")
        .replace(/(\d+)\s+poles?/g, "$1p")
        .replace(/(\d+)\s*ampere/g, "$1a")
        .replace(/(\d+)\s*amp/g, "$1a")
        .replace(/(\d+)\s+a\b/g, "$1a")
        .replace(/(\d+)\s*kiloampere/g, "$1ka")
        .replace(/(\d+)\s+ka\b/g, "$1ka")
        .replace(/(\d+)\s*volts?/g, "$1v")
        .replace(/(\d+)\s+v\b/g, "$1v")
        .replace(/(\d+)\s*kilowatts?/g, "$1kw")
        .replace(/(\d+)\s+kw\b/g, "$1kw")
        .replace(/(\d+)\s*watts?/g, "$1w")
        .replace(/(\d+)\s+w\b/g, "$1w");
        
    const rawWords = normalizedQuery.split(" ").filter((w: string) => w.trim().length > 0);
    console.log("Normalized:", rawWords);
    
    const wordsWithVariations = rawWords.map((word: string) => {
        const poleMatch = word.match(/^(\d+)p$/);
        if (poleMatch) return [word, `${poleMatch[1]} pole`, `${poleMatch[1]}-pole`, `${poleMatch[1]} poles`, `${poleMatch[1]}-poles`];
        const kaMatch = word.match(/^(\d+)ka$/);
        if (kaMatch) return [word, `${kaMatch[1]} ka`, `${kaMatch[1]}k a`];
        const ampMatch = word.match(/^(\d+)a$/);
        if (ampMatch) return [word, `${ampMatch[1]} a`, `${ampMatch[1]}amp`, `${ampMatch[1]} amp`, `${ampMatch[1]}ampere`, `${ampMatch[1]} ampere`];
        const voltMatch = word.match(/^(\d+)v$/);
        if (voltMatch) return [word, `${voltMatch[1]} v`, `${voltMatch[1]}volt`, `${voltMatch[1]} volt`, `${voltMatch[1]}vac`, `${voltMatch[1]} vac`, `${voltMatch[1]}vdc`, `${voltMatch[1]} vdc`];
        const kwMatch = word.match(/^(\d+)kw$/);
        if (kwMatch) return [word, `${kwMatch[1]} kw`, `${kwMatch[1]}kilowatt`, `${kwMatch[1]} kilowatt`];
        const wattMatch = word.match(/^(\d+)w$/);
        if (wattMatch) return [word, `${wattMatch[1]} w`, `${wattMatch[1]}watt`, `${wattMatch[1]} watt`];
        return [word];
    });

    console.log("Variations:", wordsWithVariations);
}
main();
