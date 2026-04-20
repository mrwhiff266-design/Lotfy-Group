import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the path the user is trying to visit
  const path = request.nextUrl.pathname;

  // 2. Define strict Admin Paths
  const isAdminPath = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';

  // 3. Check for the "Admin Badge" (Cookie)
  const adminToken = request.cookies.get('admin_token')?.value;

  // RULE: If trying to go to Admin Dashboard WITHOUT token -> Kick to Login
  if (isAdminPath && !isLoginPage && !adminToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // RULE: If user is ALREADY logged in and tries to go to Login -> Send to Dashboard
  if (isLoginPage && adminToken) {
    return NextResponse.redirect(new URL('/admin/orders', request.url));
  }

  return NextResponse.next();
}

// Only run this check on /admin routes
export const config = {
  matcher: '/admin/:path*',
};