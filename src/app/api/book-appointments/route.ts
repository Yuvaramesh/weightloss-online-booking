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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patient_email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Calculate priority
    const priority = await calculatePriority(issues);

    // Create Calendly booking link
    const calendlyResult = await createCalendlyBooking(
      patient_name,
      patient_email,
      preferred_time
    );

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
      calendly_scheduling_url: calendlyResult.scheduling_url || null,
      calendly_invitee_uri: null, // Will be updated via webhook when patient books
      google_meet_link: null, // Will be updated via webhook when patient books
    };

    // Store in MongoDB
    const { db } = await connectToDatabase();
    const result = await db
      .collection("patients_appointments")
      .insertOne(appointment);

    const appointmentId = result.insertedId.toString();

    // Helper function to get priority color
    const getPriorityColor = (priorityLevel: string) => {
      switch (priorityLevel.toLowerCase()) {
        case "high":
          return "#d32f2f";
        case "medium":
          return "#f57c00";
        case "low":
          return "#388e3c";
        default:
          return "#666";
      }
    };

    // Send confirmation email to patient
    const patientEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #0069ff; border-bottom: 2px solid #0069ff; padding-bottom: 10px;">Booking Confirmation</h2>
            <p>Dear <strong>${patient_name}</strong>,</p>
            <p>Your appointment request has been received successfully.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0069ff;">Appointment Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>📅 Preferred Time:</strong> ${new Date(
                  preferred_time
                ).toLocaleString()}</li>
                <li><strong>📋 Issues:</strong> ${issues}</li>
                <li><strong>⚡ Priority:</strong> <span style="color: ${getPriorityColor(
                  priority
                )}; font-weight: bold;">${priority.toUpperCase()}</span></li>
                <li><strong>🆔 Appointment ID:</strong> ${appointmentId}</li>
              </ul>
            </div>

            ${
              calendlyResult.success && calendlyResult.scheduling_url
                ? `
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">📅 Complete Your Booking</h3>
              <p>Click the button below to select your preferred time slot:</p>
              <a href="${calendlyResult.scheduling_url}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #0069ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold;">
                📅 Schedule Your Appointment
              </a>
              <p style="font-size: 14px; color: #666; margin-top: 15px;">
                Your information has been pre-filled. Just choose a time that works for you!
              </p>
            </div>
            `
                : ""
            }
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏳ Status:</strong> Your appointment is pending confirmation.</p>
              <p style="margin: 10px 0 0 0;">You will receive a confirmation email once you complete the booking on Calendly.</p>
            </div>

            <p style="margin-top: 30px;">Best regards,<br><strong>Medical Consultation Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              If you have any questions, please contact our support team.
            </p>
          </div>
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">🔔 New Appointment Request</h2>
            
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d32f2f;">Patient Information:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>👤 Name:</strong> ${patient_name}</li>
                <li><strong>📧 Email:</strong> ${patient_email}</li>
                <li><strong>📋 Issues:</strong> ${issues}</li>
                <li><strong>📅 Preferred Time:</strong> ${new Date(
                  preferred_time
                ).toLocaleString()}</li>
                <li><strong>⚡ Priority:</strong> <span style="color: ${getPriorityColor(
                  priority
                )}; font-weight: bold;">${priority.toUpperCase()}</span></li>
                <li><strong>🆔 Appointment ID:</strong> ${appointmentId}</li>
              </ul>
            </div>

            ${
              calendlyResult.success && calendlyResult.scheduling_url
                ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📅 Calendly Scheduling Link:</strong> Generated successfully</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Patient will receive a personalized scheduling link via email.
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="${calendlyResult.scheduling_url}" style="color: #0069ff; text-decoration: none; font-weight: bold;">Preview Scheduling Link →</a>
              </p>
            </div>
            `
                : ""
            }
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
              <p style="margin: 0 0 15px 0; font-weight: bold;">📋 Next Steps:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Patient will select a time slot on Calendly</li>
                <li>You'll receive a notification when booking is confirmed</li>
                <li>Google Meet link will be automatically generated</li>
              </ul>
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/doctor/dashboard" 
                 style="display: inline-block; padding: 12px 24px; background-color: #0069ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                View Dashboard
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      process.env.DOCTOR_EMAIL!,
      `New Appointment Request - Priority: ${priority.toUpperCase()}`,
      doctorEmailBody
    );

    return NextResponse.json({
      success: true,
      message:
        "Appointment request submitted successfully! Please check your email for the scheduling link.",
      appointment_id: appointmentId,
      scheduling_url: calendlyResult.scheduling_url,
      priority: priority,
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
