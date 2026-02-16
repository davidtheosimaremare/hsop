
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Checking models with API Key: ${apiKey.substring(0, 5)}...`);

fetch(url)
    .then(async (res) => {
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Request Failed: ${res.status} ${res.statusText}\n${text}`);
        }
        return res.json();
    })
    .then((data) => {
        console.log("Successfully retrieved models:");
        if (data.models) {
            data.models.forEach((model: any) => {
                console.log(`- ${model.name}`);
                if (model.supportedGenerationMethods) {
                    console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
                }
            });
        } else {
            console.log("No models found in response:", data);
        }
    })
    .catch((err) => {
        console.error(err);
    });
