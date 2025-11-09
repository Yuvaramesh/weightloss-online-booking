// src/app/api/auth/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      isDoctor: boolean;
      name: string;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        isDoctor: decoded.isDoctor,
      },
    });
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
