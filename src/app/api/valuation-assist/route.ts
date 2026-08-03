import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { predictValuationFields } from '@/lib/ai/predictor';
import { generateValuationNarrative } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fields } = body;

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'Invalid request: fields object required' }, { status: 400 });
    }

    // Run predictions
    const predictionResult = predictValuationFields(fields);

    // Generate LLM narrative (only if API key is configured, otherwise returns '')
    let narrative = '';
    if (Object.keys(predictionResult.suggestions).length > 0) {
      try {
        narrative = await generateValuationNarrative(fields, predictionResult.suggestions);
      } catch (err) {
        // LLM failure is non-critical — predictions still work
        console.warn('LLM narrative generation skipped:', err);
      }
    }

    return NextResponse.json({
      suggestions: predictionResult.suggestions,
      filledCount: predictionResult.filledCount,
      totalFields: predictionResult.totalFields,
      overallConfidence: predictionResult.overallConfidence,
      narrative,
    });
  } catch (error) {
    console.error('Valuation assist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
