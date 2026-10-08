import { NextResponse, type NextRequest } from 'next/server';

// same name as SESSION_COOKIE_NAME in the backend
const SESSION_COOKIE = 'dst_session';

// Only a UX redirect - the API still verifies the token on every write.
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/manage/:path*'],
};
