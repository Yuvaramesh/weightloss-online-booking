// src/app/api/book-appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import { calculatePriority } from "../../../lib/utils";
import { createCalendlyBooking } from "../../../lib/calendly";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { patient_name, patient_email, issues, preferred_time } = data;

    // Validate required fields
    if (!patient_name || !patient_email || !issues) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patient_email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Calculate priority (this might be slow if using AI)
    const priority = await calculatePriority(issues);

    // Create Calendly booking link with pre-filled data
    const calendlyResult = await createCalendlyBooking(
      patient_name,
      patient_email,
      preferred_time || new Date().toISOString()
    );

    // Create appointment document (pending until Calendly booking is confirmed)
    const appointment = {
      patient_name,
      patient_email,
      issues,
      preferred_time: preferred_time || null,
      priority,
      status: "pending", // Will be updated to "scheduled" by webhook
      created_at: new Date().toISOString(),
      doctor_approved: false,
      calendly_scheduling_url: calendlyResult.scheduling_url || null,
      calendly_invitee_uri: null, // Will be set by webhook
      google_meet_link: null, // Will be set by webhook
      confirmed_time: null, // Will be set by webhook
    };

    // Store in MongoDB
    const { db } = await connectToDatabase();
    const result = await db
      .collection("patients_appointments")
      .insertOne(appointment);

    const appointmentId = result.insertedId.toString();

    // Return immediately with Calendly URL for redirect
    return NextResponse.json({
      success: true,
      message: "Appointment initiated. Please complete booking on Calendly.",
      appointment_id: appointmentId,
      scheduling_url: calendlyResult.scheduling_url,
      priority: priority,
      redirect_to_calendly: true,
    });
  } catch (error) {
    console.error("Error processing appointment:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}
