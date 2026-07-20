import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64, description } = await request.json();

    if (!imageBase64 && !description) {
      return NextResponse.json({ error: 'Please provide a photo or a description.' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const promptText = `
      Analyze this meal. Provide a reasonable estimation of its nutritional values based on ${description ? `the description: "${description}"` : ''} ${imageBase64 ? 'and the provided image' : ''}.
      Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or backticks:
      {
        "name": "A short, descriptive name for the meal",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "rationale": "A short, one or two sentence explanation of how you estimated these macros."
      }
      If you cannot identify food, return 0 for all numbers, "Unknown Food" for the name, and "Could not identify the food." for the rationale.
    `;

    const parts: any[] = [{ text: promptText }];

    if (imageBase64) {
      // Clean up the base64 string if it has a data URI prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 300
        }
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("Gemini HTTP Error:", errText);
      let errMsg = `Gemini API error (${apiResponse.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch {}
      return NextResponse.json({ error: errMsg }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error("No text returned from Gemini");
    }

    let resultJson;
    
    try {
      resultJson = JSON.parse(textResult);
    } catch (e) {
      const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      resultJson = JSON.parse(cleanJson);
    }

    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error("Gemini API Exception:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze the meal.' }, { status: 500 });
  }
}
