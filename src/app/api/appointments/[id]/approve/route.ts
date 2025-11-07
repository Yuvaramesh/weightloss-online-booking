// src/app/api/appointments/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/mongodb";
import { sendEmail } from "../../../../../lib/email";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: appointmentId } = await context.params;

    // Create Google Meet link (simplified)
    const meetLink = `https://meet.google.com/${appointmentId.slice(0, 10)}`;

    // Update appointment
    const { db } = await connectToDatabase();
    await db.collection("patients_appointments").updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          status: "approved",
          doctor_approved: true,
          google_meet_link: meetLink,
          approved_at: new Date().toISOString(),
        },
      }
    );

    // Get appointment details
    const appointment = await db
      .collection("patients_appointments")
      .findOne({ _id: new ObjectId(appointmentId) });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    // Send confirmation email to patient
    const emailBody = `
      <html>
        <body>
          <h2>Appointment Confirmed!</h2>
          <p>Dear ${appointment.patient_name},</p>
          <p>Your appointment has been approved by the doctor.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Time: ${appointment.preferred_time}</li>
            <li>Google Meet Link: <a href="${meetLink}">${meetLink}</a></li>
          </ul>
          <p>You will receive a reminder 10 minutes before your consultation.</p>
          <p>Best regards,<br>Medical Consultation Team</p>
        </body>
      </html>
    `;
    await sendEmail(
      appointment.patient_email,
      "Appointment Confirmed",
      emailBody
    );

    return NextResponse.json({
      success: true,
      message: "Appointment approved",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
