// src/app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const appointments = await db
      .collection("patients_appointments")
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    // Convert ObjectId to string
    const formattedAppointments = appointments.map((apt) => ({
      ...apt,
      _id: apt._id.toString(),
    }));

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      High: 0,
      Medium: 1,
      Low: 2,
    };
    formattedAppointments.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
    );

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
