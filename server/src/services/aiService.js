import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Service for parsing Australian Aged Care Referrals
 */
export const parseReferral = async (fileBuffer, mimeType) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert Clinical Intake Assistant for Australian Home Care. 
      Analyze the provided referral document and extract the following information into a JSON object:
      {
        "client_name": "Full Name",
        "dob": "YYYY-MM-DD",
        "my_aged_care_id": "ID if available",
        "funding_type": "HCP | CHSP | NDIS | Private | Unknown",
        "hcp_level": 1-4 or null,
        "referral_source": "Hospital Name, GP, etc.",
        "summary": "Short 2-3 sentence clinical summary",
        "address": "Full street address",
        "suburb": "City/Town",
        "postcode": "XXXX",
        "requested_services": ["service1", "service2"]
      }
      If a field is not found, use null. Be precise with Australian funding levels.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Attempt to extract JSON from text (sometimes Gemini adds Markdown markers)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse clinical data from AI response');
  } catch (error) {
    console.error('AI Parsing Error:', error);
    throw error;
  }
};
