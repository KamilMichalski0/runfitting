import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Utwórz klienta Supabase z cookies
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Poczekaj na pobranie sesji
    const { data: { session } } = await supabase.auth.getSession();

    // Jeśli jest sesja, dodaj token do nagłówka
    if (session?.access_token) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('Authorization', `Bearer ${session.access_token}`);

      // Przekieruj request z nowym nagłówkiem
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Konfiguracja dla jakich ścieżek middleware ma działać
export const config = {
  matcher: [
    '/api/:path*',  // Wszystkie API routes
    '/((?!_next/static|_next/image|favicon.ico).*)',  // Wszystko oprócz statycznych assetów
  ],
};
