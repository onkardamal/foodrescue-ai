import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, Recipe, ScanResult, FoodCategory, NGO } from '../types';

// Lazy-init so app loads even without an API key (AI features will no-op or throw when used)
function getAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add GEMINI_API_KEY or VITE_GEMINI_API_KEY to .env.local (and in Vercel env vars for production).");
  return new GoogleGenAI({ apiKey });
}

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

    const response = await getAI().models.generateContent({
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

    const response = await getAI().models.generateContent({
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

/**
 * Searches for nearby NGOs using Gemini Google Maps grounding.
 * The model returns structured JSON with real place data from Maps,
 * and grounding metadata provides verified source links.
 */
export const searchNearbyNGOs = async (lat: number, lng: number): Promise<NGO[]> => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a location search assistant. Find real food banks, soup kitchens, shelters, community fridges, or food rescue NGOs near latitude ${lat}, longitude ${lng}.

Return ONLY a JSON array (no markdown, no explanation). Each object must have:
- "name": exact real name of the place
- "lat": real latitude of the place (number)
- "lng": real longitude of the place (number)
- "address": full street address
- "description": one sentence about what they do
- "rating": Google Maps rating if available, otherwise null
- "phone": phone number if available, otherwise null
- "website": website URL if available, otherwise null

IMPORTANT: Use REAL coordinates from Google Maps data. Do NOT invent or randomize coordinates. Every place must be a real, verifiable location. Return up to 8 places. Start with [ and end with ].`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const ngos: NGO[] = [];

    // Build a lookup of verified place names from grounding metadata
    const grounding = (response as any).candidates?.[0]?.groundingMetadata;
    const groundedPlaces = new Map<string, string>();
    if (grounding?.groundingChunks) {
      for (const chunk of grounding.groundingChunks) {
        if (chunk.maps?.title) {
          groundedPlaces.set(chunk.maps.title.toLowerCase(), chunk.maps.uri || '');
        }
      }
    }

    // Parse the structured JSON from the model's text response
    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          if (Array.isArray(data)) {
            data.forEach((item: any, i: number) => {
              if (!item.name) return;

              const itemLat = typeof item.lat === 'number' ? item.lat : null;
              const itemLng = typeof item.lng === 'number' ? item.lng : null;

              // Skip entries with obviously fake coordinates (exactly matching input or zero)
              if (!itemLat || !itemLng || (itemLat === lat && itemLng === lng)) return;

              // Check if this place is backed by grounding metadata
              const groundedUri = groundedPlaces.get(item.name.toLowerCase());

              ngos.push({
                id: `real-${Date.now()}-${i}`,
                name: item.name,
                distance: "Nearby",
                rating: (typeof item.rating === 'number' && item.rating >= 1 && item.rating <= 5) ? item.rating : 4.0,
                description: item.description || "Food assistance organization.",
                lat: itemLat,
                lng: itemLng,
                address: item.address || undefined,
                phone: item.phone || undefined,
                email: item.email || undefined,
                website: groundedUri || item.website || undefined,
                needs: [FoodCategory.PRODUCE, FoodCategory.CANNED]
              });
            });
          }
        } catch {
          // JSON parse failed
        }
      }
    }

    // Fallback: if text parsing failed, build entries from grounding chunks alone
    if (ngos.length === 0 && groundedPlaces.size > 0) {
      let i = 0;
      for (const [name, uri] of groundedPlaces) {
        ngos.push({
          id: `grounded-${Date.now()}-${i}`,
          name: name.replace(/\b\w/g, c => c.toUpperCase()),
          distance: "Nearby",
          rating: 4.0,
          description: "Food assistance organization.",
          lat: lat + (i * 0.003) - 0.01,
          lng: lng + (i * 0.003) - 0.01,
          address: undefined,
          website: uri || undefined,
          needs: [FoodCategory.PRODUCE, FoodCategory.CANNED]
        });
        i++;
      }
    }

    return ngos;

  } catch (error) {
    console.error("Gemini NGO Search Error:", error);
    throw error;
  }
}