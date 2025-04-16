import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:3000'; // URL backendu

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Utwórz klienta Supabase
    const supabase = createRouteHandlerClient({ cookies });

    // Poczekaj na sesję
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Przygotuj URL do backendu
    const path = params.path.join('/');
    const backendUrl = `${BACKEND_URL}/api/${path}`;
    
    // Debug URL
    console.log('Backend URL:', backendUrl);
    
    console.log('Session:', session ? 'exists' : 'none');
    console.log('Access token:', session.access_token ? 'exists' : 'none');
    console.log('Forwarding request to:', backendUrl);
    console.log('Making request to backend with token:', session.access_token.substring(0, 10) + '...');

    // Wykonaj request do backendu
    const backendRes = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Backend response status:', backendRes.status);

    // Przekaż odpowiedź z backendu
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Obsługa innych metod HTTP
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const body = await req.json();
  // ... podobna logika jak w GET, ale z body
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  const body = await req.json();
  // ... podobna logika jak w GET, ale z body
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  // ... podobna logika jak w GET
}
