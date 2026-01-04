import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, Recipe, ScanResult, FoodCategory } from '../types';

// Initialize Gemini
// Note: process.env.API_KEY is guaranteed to be available in this environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image of food to identify what it is and estimate expiry.
 * Uses gemini-3-flash-preview for vision capabilities with structured JSON output.
 */
export const analyzeFoodImage = async (base64Image: string): Promise<ScanResult> => {
  try {
    const prompt = `
      You are an expert food quality inspector. 
      1. Identify the main food item.
      2. **Crucially: Analyze its visual condition** for freshness (look for spots, bruising, color vibrancy, wilting, or texture changes).
      3. Estimate the expiry date based on this specific visual condition (e.g. a spotted banana expires sooner than a green one).
      
      Return a JSON object with:
      - name: Name of the item.
      - category: One of [Produce, Dairy, Meat, Grains, Bakery, Canned, Other].
      - condition: A short description of the visual state (e.g., "Fresh & Firm", "Ripe with spots", "Slightly Wilted", "Moldy").
      - expiryEstimation: Estimated expiry date from today (YYYY-MM-DD) based on the condition.
      - quantityEstimation: Estimated quantity (number).
      - unitEstimation: Unit (pc, kg, liter, etc).

      If not food, set name="Unknown Item".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Produce", "Dairy", "Meat", "Grains", "Bakery", "Canned", "Other"] },
            condition: { type: Type.STRING, description: "Visual description of freshness state" },
            expiryEstimation: { type: Type.STRING, description: "YYYY-MM-DD" },
            quantityEstimation: { type: Type.NUMBER },
            unitEstimation: { type: Type.STRING }
          },
          required: ["name", "category", "condition", "expiryEstimation", "quantityEstimation", "unitEstimation"]
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response text from Gemini");
    }
    
    const cleanText = text.replace(/```json|```/g, '').trim();
    let data;

    try {
        data = JSON.parse(cleanText);
    } catch (parseError) {
        console.warn("Failed to parse Gemini response:", text);
        return {
          name: "Unknown Item",
          category: "Other",
          condition: "Unknown",
          expiryEstimation: new Date().toISOString().split('T')[0],
          quantityEstimation: 1,
          unitEstimation: "pc"
        };
    }

    return {
      name: data.name || "Unknown Item",
      category: data.category || "Other",
      condition: data.condition || "Good",
      expiryEstimation: data.expiryEstimation || new Date().toISOString().split('T')[0],
      quantityEstimation: data.quantityEstimation || 1,
      unitEstimation: data.unitEstimation || "unit"
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return {
      name: "Unknown Item",
      category: "Other",
      condition: "Unknown",
      expiryEstimation: new Date().toISOString().split('T')[0],
      quantityEstimation: 1,
      unitEstimation: "pc"
    };
  }
};

/**
 * Generates recipes based on available inventory.
 * Uses gemini-3-flash-preview for structured text generation with schema.
 */
export const generateSmartRecipes = async (inventory: FoodItem[]): Promise<Recipe[]> => {
  try {
    const availableIngredients = inventory
      .map(item => `${item.name} (${item.condition || 'Good'}, Expires: ${item.expiryDate})`)
      .join(", ");

    if (!availableIngredients) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Suggest 3 creative recipes that use these ingredients: ${availableIngredients}.
        Prioritize items that are detected as "Ripe" or "Expiring Soon".
        Assume standard pantry staples (oil, salt, pepper, flour) are available.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              instructions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              cookingTime: { type: Type.INTEGER },
              difficulty: { type: Type.STRING },
              savedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of ingredient names from the input used in this recipe"
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const cleanText = text.replace(/```json|```/g, '').trim();
    const recipes = JSON.parse(cleanText);
    
    return recipes.map((r: any, index: number) => ({
      ...r,
      id: `generated-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    return [];
  }
};