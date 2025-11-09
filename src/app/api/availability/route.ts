import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CALENDLY_API_KEY;
    const availabilityUrl = process.env.CALENDLY_AVAILABILITY_URL;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Calendly API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(availabilityUrl!, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch availability schedules",
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching Calendly availability:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
