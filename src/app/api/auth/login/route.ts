import { NextResponse } from 'next/server';
import connectDB from '@/lib/db'; 
import AdminUser from '@/models/AdminUser';
import bcrypt from 'bcryptjs';

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || 'local';
    const key = `${ipAddress}:${username}`;
    const now = Date.now();
    const attempt = loginAttempts.get(key);

    if (attempt && attempt.count >= 5 && now - attempt.lastAttempt < 15 * 60 * 1000) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    await connectDB();

    const user = await AdminUser.findOne({ username }).select('+password');

    if (!user) {
      loginAttempts.set(key, { count: (attempt?.count || 0) + 1, lastAttempt: now });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      loginAttempts.set(key, { count: (attempt?.count || 0) + 1, lastAttempt: now });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.active === false) {
      return NextResponse.json(
        { error: 'Account disabled.' }, 
        { status: 403 }
      );
    }

    loginAttempts.delete(key);

    const response = NextResponse.json({ 
      success: true, 
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    });

    response.cookies.set('admin_token', 'true', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8
    });

    return response;

  } catch (error) {
    console.error("[Login Error]:", error);
    return NextResponse.json({ error: 'Login failed', details: String(error) }, { status: 500 });
  }
}
