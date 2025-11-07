// src/app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import { WithId, Document } from "mongodb";

interface Appointment {
  patient_name: string;
  patient_email: string;
  issues: string;
  preferred_time: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  doctor_approved: boolean;
  google_meet_link: string | null;
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const appointments = await db
      .collection<Appointment>("patients_appointments")
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    // Convert ObjectId to string
    const formattedAppointments = appointments.map(
      (apt: WithId<Appointment>) => ({
        ...apt,
        _id: apt._id.toString(),
      })
    );

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
