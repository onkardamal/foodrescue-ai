
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
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Analyze this image. Today is ${today}.
      1. First, strictly determine if the image contains edible food.
      2. Identify the item name and category.
      3. Assess its visual condition (Fresh, Ripe, Bruised, Wilted, etc.).
      4. Estimate a specific expiry date (YYYY-MM-DD) based on its condition relative to today (${today}).
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
            isFood: { type: Type.BOOLEAN, description: "True ONLY if image contains food/ingredients. False for people, pets, blurred objects, etc." },
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Produce", "Dairy", "Meat", "Grains", "Bakery", "Canned", "Other"] },
            condition: { type: Type.STRING, description: "Visual freshness state e.g. 'Fresh', 'Ripe', 'Wilted'" },
            expiryEstimation: { type: Type.STRING, description: "YYYY-MM-DD" },
            quantityEstimation: { type: Type.NUMBER },
            unitEstimation: { type: Type.STRING }
          },
          required: ["isFood", "name", "category", "condition", "expiryEstimation", "quantityEstimation", "unitEstimation"]
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
        throw new Error("Failed to parse AI response");
    }

    if (!data.isFood) {
        throw new Error("NOT_FOOD");
    }

    return {
      name: data.name || "Unknown Item",
      category: data.category || "Other",
      condition: data.condition || "Good",
      expiryEstimation: data.expiryEstimation || today,
      quantityEstimation: data.quantityEstimation || 1,
      unitEstimation: data.unitEstimation || "unit"
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
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
