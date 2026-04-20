import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  
  // Clear the cookie by setting it to expire in the past
  response.cookies.set("admin_token", "", { 
    expires: new Date(0), 
    path: "/" 
  });

  return response;
}