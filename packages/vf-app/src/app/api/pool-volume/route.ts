import { type NextRequest, NextResponse } from 'next/server';

// API route to fetch 24h pool volume from Ref Finance
// This avoids CORS issues by making the request server-side
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const poolId = searchParams.get('pool_id');

  if (!poolId) {
    return NextResponse.json(
      { error: 'pool_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://api.data-service.ref.finance/api/poollist/${poolId}/24hvolume/sum`;
    
    // Create AbortController with 3 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Return 0 volume gracefully - pool may have no trading volume or API doesn't track this pool
      return NextResponse.json({
        pool_id: poolId,
        volume: '0',
      });
    }

    const volume = await response.json() as number;
    
    return NextResponse.json({
      pool_id: poolId,
      volume: String(volume ?? '0'),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[API /pool-volume] Request timeout after 3s for pool:', poolId);
    } else {
      console.error('[API /pool-volume] Error:', error);
    }
    // Return 0 gracefully instead of erroring
    return NextResponse.json({
      pool_id: poolId,
      volume: '0',
    });
  }
}
