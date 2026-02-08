const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Final check for gemini-2.0-flash...");

    const genAI = new GoogleGenerativeAI(key);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say 'I am ready'");
        console.log("✅ SUCCESS! AI Response:", result.response.text());
    } catch (err) {
        console.log("❌ FAILED with gemini-2.0-flash:", err.message);
    }
}

test();
