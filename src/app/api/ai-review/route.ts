import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { meals, weights, goals } = await request.json();

    if (!meals || meals.length === 0) {
      return NextResponse.json({ review: 'You have not logged any meals in the last 7 days. Start logging to get your weekly insights!' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const promptText = `
      You are an expert nutrition coach who delivers supportive, evidence-based guidance. Review the user's meal logs and weight trends for the last 7 days.

      User's Daily Goals: ${goals?.calories || 2000} kcal, ${goals?.protein || 150}g protein.
      User's Target Weight: ${goals?.targetWeight || 'Not set'} lbs.
      User's Recent Weigh-ins: ${JSON.stringify(weights || [])}
      User's Meals: ${JSON.stringify(meals)}

      Please write a concise 2-3 paragraph weekly summary based on the following guidelines:

      1. Objective Progress Review: Acknowledge clear wins from the data (e.g., consistency in tracking or hitting targets). If weight data is present, contextualize it within a normal range of daily fluid and glycogen fluctuations rather than short-term fat loss or gain.
      2. Nutritional Quality & Health Analysis: Look beyond the raw numbers. Evaluate whether their overall dietary patterns (e.g., meal frequency, food variety, whole foods vs. ultra-processed foods) support long-term metabolic health and lifestyle sustainability. 
      3. Evidence-Based Improvement: Identify one specific area where adjusting their habits would yield better health outcomes or improve adherence, explaining the brief "why" behind it.
      4. Actionable Next Step: Conclude with one practical, sustainable tip for the upcoming week.

      CRITICAL FORMATTING RULE: Do NOT use any Markdown headers (#, ##, ###) or bullet points. Keep the response entirely as plain text paragraphs separated by basic line breaks. You may use **bolding** sparingly for key terms.
    `;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500
        }
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`Gemini API returned ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ review: textResult });
  } catch (error) {
    console.error("AI Review Error:", error);
    return NextResponse.json({ error: 'Failed to generate review.' }, { status: 500 });
  }
}
