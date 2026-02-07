const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini to analyze a medical report (image or PDF).
 * @param {string} filePath Path to the file.
 * @param {string} mimeType File mime type.
 * @returns {Promise<Object>} AI analysis result.
 */
async function analyzeReport(filePath, mimeType) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileData = fs.readFileSync(filePath);
    const part = {
        inlineData: {
            data: fileData.toString("base64"),
            mimeType: mimeType
        }
    };

    const prompt = `
    Analyze this medical report/prescription. 
    1. Extract key health vitals and lab results (e.g., Hemoglobin, Vitamin D, Cholesterol, etc.).
    2. Identify any values that are outside the normal range (flag as concern).
    3. Summarize the overall health status based on this document.
    4. Suggest next steps or areas to discuss with a doctor.
    5. Highlight things that are going well.
    
    Format the response as JSON with the following structure:
    {
      "vitals": [{"name": "...", "value": "...", "unit": "...", "status": "normal/high/low"}],
      "summary": "...",
      "concerns": ["..."],
      "positives": ["..."],
      "nextSteps": ["..."]
    }
    
    Only return the JSON.
  `;

    const result = await model.generateContent([prompt, part]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the markdown code block if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse AI response as JSON");
}

module.exports = { analyzeReport };
