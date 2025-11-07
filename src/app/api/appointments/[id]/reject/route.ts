// src/app/api/appointments/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/mongodb";
import { sendEmail } from "../../../../../lib/email";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    // Update appointment
    const { db } = await connectToDatabase();
    await db.collection("patients_appointments").updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          status: "rejected",
          doctor_approved: false,
          rejected_at: new Date().toISOString(),
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

    // Send rejection email with reschedule link
    const rescheduleLink =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailBody = `
      <html>
        <body>
          <h2>Appointment Update</h2>
          <p>Dear ${appointment.patient_name},</p>
          <p>Unfortunately, the doctor is not available at your requested time.</p>
          <p>Please reschedule your appointment: <a href="${rescheduleLink}">Reschedule Now</a></p>
          <p>We apologize for the inconvenience.</p>
          <p>Best regards,<br>Medical Consultation Team</p>
        </body>
      </html>
    `;
    await sendEmail(
      appointment.patient_email,
      "Appointment Rescheduling Required",
      emailBody
    );

    return NextResponse.json({
      success: true,
      message: "Appointment rejected",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
