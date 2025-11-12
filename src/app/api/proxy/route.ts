/**
 * API Proxy Route
 * 
 * Proxies requests to HTTP endpoints to avoid mixed content errors.
 * When the frontend is served over HTTPS, browsers block HTTP requests.
 * This proxy makes the HTTP request server-side and forwards the response.
 * 
 * Usage: /api/proxy?url=http://example.com/api/endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleProxyRequest(request);
}

async function handleProxyRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL parameter is missing' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Prepare headers for the target request
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Skip host header and other problematic headers
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    headers['host'] = validatedUrl.host;

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      // Add cache control to prevent caching issues
      cache: 'no-store',
    };

    // Include body for methods that support it
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // Body might be empty, that's okay
      }
    }

    // Make the proxied request
    const response = await fetch(validatedUrl.href, fetchOptions);

    // Get response body
    const responseData = await response.arrayBuffer();

    // Forward the response with original headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip certain headers that can cause issues
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Add CORS headers to allow frontend access
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy request failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: errorMessage,
        status: 500,
      },
      { status: 500 }
    );
  }
}

