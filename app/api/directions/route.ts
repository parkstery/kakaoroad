
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and Destination are required' }, { status: 400 });
  }

  // Retrieve API Key from Server-side Environment Variables
  const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

  if (!KAKAO_API_KEY) {
    console.error("KAKAO_REST_API_KEY is not defined in environment variables.");
    return NextResponse.json({ error: 'Server misconfiguration: API Key missing' }, { status: 500 });
  }

  const kakaoUrl = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&priority=RECOMMEND`;

  try {
    const response = await fetch(kakaoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Kakao API Error: ${response.status}`, errorData);
      return NextResponse.json({ error: `Kakao API Failed: ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
