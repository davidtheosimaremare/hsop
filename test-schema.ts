import { tool } from "ai";
import { z } from "zod";

const t = tool({
    description: "Cari produk",
    parameters: z.object({ query: z.string().describe("Kata kunci") }),
    execute: async () => "OK"
});

console.log(JSON.stringify(t.parameters, null, 2));
