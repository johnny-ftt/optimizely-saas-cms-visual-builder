import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest)
{
    const optimizelyCmsUrl = process.env.OPTIMIZELY_CMS_URL ?? ''

    // Add CSP
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' ${ optimizelyCmsUrl}' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' ${ optimizelyCmsUrl } blob: data:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self' ${ optimizelyCmsUrl };
        frame-ancestors ${ optimizelyCmsUrl || 'none'};
        upgrade-insecure-requests;
    `
    // Replace newline characters and spaces
    const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim()

    console.log("Generated CSP Header:", contentSecurityPolicyHeaderValue);

    // Create response with modified headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    let response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

  // Clone the response to set headers correctly
  response = new NextResponse(response.body, response);

  // Add the CSP header to the response
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  response.headers.set('Cache-Control', 'no-store');

  // Enable dev mode adjustments
  const isDev = process.env.NODE_ENV !== 'production' || request.nextUrl.host.includes('localhost');
  if (isDev) {
      response.headers.set('X-Dev-Mode', 'true');
  }
  else{
    response.headers.set('X-Prod-Mode', 'true');  
  }

  // Make sure we're always in English - multi language is not supported yet
  // if (!request.nextUrl.pathname.startsWith("/en")) {
  //     const newUrl = request.nextUrl.clone();
  //     newUrl.pathname = "/en" + newUrl.pathname;
  //     return NextResponse.redirect(newUrl, {
  //         status: isDev ? 307 : 308
  //     });
  // }

  // Assign a Visitor ID cookie, so we can identify and track individual visitors
//   const visitorId = Session.getOrCreateVisitorId(request);
//   Session.addVisitorId(response, visitorId);

  return response;
}

export const config = {
    matcher: [
      // Skip all internal paths and paths with a '.'
      // Internal paths are:
      // - /ui => Optimizely CMS generated routes for On Page Edit
      // - /api => Services specific for the frontend
      // - /assets => Specific static files
      // - /_next => Next.JS specific files
      // - /_vercel => Vercel infrastructure routes
      // - /mobile.app => SPA for "installed usage"
          
      '/((?!.*\\.|ui|api|assets|_next\\/static|_next\\/image|_vercel|mobile\\.app).*)',
    ],
  }