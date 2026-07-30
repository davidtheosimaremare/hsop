import "dotenv/config";
import { tool } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

process.env.OPENAI_API_KEY = process.env.SUMOPOD_API_KEY || "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
process.env.OPENAI_BASE_URL = "https://ai.sumopod.com/v1";

async function main() {
    try {
        console.log("Calling sumopod via standard openai provider...");
        const result = await generateText({
            model: openai("gpt-4.1-mini", { structuredOutputs: false }),
            prompt: "Cari MCB 16A",
            tools: {
                searchProducts: tool({
                    description: "Cari produk",
                    parameters: z.object({ query: z.string() }),
                    execute: async ({ query }) => {
                        return { found: true, products: [] };
                    }
                })
            }
        });
        console.log("Success:", result.text);
    } catch (err: any) {
        console.error("Error calling sumopod:");
        console.error(err.message);
    }
}

main();
