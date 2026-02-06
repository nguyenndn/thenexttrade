import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Auth logic sẽ được thêm sau
  return NextResponse.json({ message: 'Login endpoint' });
}


