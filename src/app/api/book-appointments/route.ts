// src/app/api/book-appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import { sendEmail } from "../../../lib/email";
import { calculatePriority } from "../../../lib/utils";
import { createCalendlyBooking } from "../../../lib/calendly";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { patient_name, patient_email, issues, preferred_time } = data;

    // Validate required fields
    if (!patient_name || !patient_email || !issues || !preferred_time) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Calculate priority
    const priority = calculatePriority(issues);

    // Create appointment document
    const appointment = {
      patient_name,
      patient_email,
      issues,
      preferred_time,
      priority,
      status: "pending",
      created_at: new Date().toISOString(),
      doctor_approved: false,
      google_meet_link: null,
    };

    // Store in MongoDB
    const { db } = await connectToDatabase();
    const result = await db
      .collection("patients_appointments")
      .insertOne(appointment);

    const appointmentId = result.insertedId.toString();

    // Create Calendly booking
    await createCalendlyBooking(patient_name, patient_email, preferred_time);

    // Send confirmation email to patient
    const patientEmailBody = `
      <html>
        <body>
          <h2>Booking Confirmation</h2>
          <p>Dear ${patient_name},</p>
          <p>Your appointment request has been received successfully.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Preferred Time: ${preferred_time}</li>
            <li>Issues: ${issues}</li>
            <li>Priority: ${priority}</li>
          </ul>
          <p>Your appointment is pending doctor confirmation. You will receive another email once the doctor approves.</p>
          <p>Best regards,<br>Medical Consultation Team</p>
        </body>
      </html>
    `;
    await sendEmail(
      patient_email,
      "Appointment Booking Received",
      patientEmailBody
    );

    // Notify doctor
    const doctorEmailBody = `
      <html>
        <body>
          <h2>New Appointment Request</h2>
          <p><strong>Patient:</strong> ${patient_name}</p>
          <p><strong>Email:</strong> ${patient_email}</p>
          <p><strong>Issues:</strong> ${issues}</p>
          <p><strong>Preferred Time:</strong> ${preferred_time}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p>Please log in to your dashboard to approve or reject this appointment.</p>
        </body>
      </html>
    `;
    await sendEmail(
      process.env.DOCTOR_EMAIL!,
      `New Appointment - Priority: ${priority}`,
      doctorEmailBody
    );

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully! Email will be sent shortly",
      appointment_id: appointmentId,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
