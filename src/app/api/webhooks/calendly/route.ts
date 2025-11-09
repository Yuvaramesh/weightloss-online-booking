// src/app/api/webhooks/calendly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import { sendEmail } from "../../../../lib/email";
import crypto from "crypto";

/**
 * Calendly Webhook Handler
 * Handles events when patients book, cancel, or reschedule appointments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("calendly-webhook-signature");
    const webhookSigningKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

    // Verify webhook signature (if configured)
    if (webhookSigningKey && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSigningKey)
        .update(body)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { event, payload: eventPayload } = payload;

    console.log("Calendly webhook received:", event);

    // Handle different event types
    switch (event) {
      case "invitee.created":
        await handleInviteeCreated(eventPayload);
        break;
      case "invitee.canceled":
        await handleInviteeCanceled(eventPayload);
        break;
      default:
        console.log("Unhandled event type:", event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle when a patient books an appointment
 */
async function handleInviteeCreated(payload: any) {
  try {
    const { email, name, uri: inviteeUri } = payload;
    const eventUri = payload.event;
    const scheduledEventUri = payload.scheduled_event?.uri;

    console.log("Invitee created:", { email, name, inviteeUri });

    // Fetch event details to get Google Meet link
    const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
    if (!CALENDLY_API_KEY) {
      console.warn("Calendly API key not configured");
      return;
    }

    // Get event details
    const eventResponse = await fetch(scheduledEventUri, {
      headers: {
        Authorization: `Bearer ${CALENDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!eventResponse.ok) {
      console.error("Failed to fetch event details");
      return;
    }

    const eventData = await eventResponse.json();
    const event = eventData.resource;
    const googleMeetLink = event.location?.join_url || null;
    const startTime = event.start_time;
    const endTime = event.end_time;

    // Update appointment in database
    const { db } = await connectToDatabase();
    const result = await db
      .collection("patients_appointments")
      .findOneAndUpdate(
        { patient_email: email },
        {
          $set: {
            calendly_invitee_uri: inviteeUri,
            calendly_event_uri: scheduledEventUri,
            google_meet_link: googleMeetLink,
            confirmed_time: startTime,
            status: "scheduled",
            updated_at: new Date().toISOString(),
          },
        },
        { sort: { created_at: -1 }, returnDocument: "after" }
      );

    if (!result) {
      console.error("Appointment not found for email:", email);
      return;
    }

    // Send confirmation email to patient
    const patientEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Appointment Confirmed!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your medical consultation has been successfully scheduled!</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">📅 Appointment Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>📅 Date & Time:</strong> ${new Date(
                  startTime
                ).toLocaleString()}</li>
                <li><strong>⏱️ Duration:</strong> 15 minutes</li>
                ${
                  googleMeetLink
                    ? `<li><strong>📹 Meeting Link:</strong> <a href="${googleMeetLink}" style="color: #0069ff;">Join Google Meet</a></li>`
                    : ""
                }
              </ul>
            </div>

            ${
              googleMeetLink
                ? `
            <div style="margin: 30px 0; text-align: center;">
              <a href="${googleMeetLink}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #0069ff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                🎥 Join Video Consultation
              </a>
            </div>
            `
                : ""
            }

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ Important Reminders:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Join the meeting 5 minutes early</li>
                <li>Ensure stable internet connection</li>
                <li>Keep your medical history ready</li>
                <li>Have your questions prepared</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">Looking forward to your consultation!</p>
            <p>Best regards,<br><strong>Medical Consultation Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      email,
      "✅ Your Medical Consultation is Confirmed",
      patientEmailBody
    );

    // Notify doctor
    const doctorEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Patient Booked Appointment</h2>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">Patient Information:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>👤 Name:</strong> ${name}</li>
                <li><strong>📧 Email:</strong> ${email}</li>
                <li><strong>📅 Scheduled Time:</strong> ${new Date(
                  startTime
                ).toLocaleString()}</li>
                ${
                  googleMeetLink
                    ? `<li><strong>📹 Google Meet:</strong> <a href="${googleMeetLink}">Join Meeting</a></li>`
                    : ""
                }
              </ul>
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/doctor/dashboard" 
                 style="display: inline-block; padding: 12px 24px; background-color: #0069ff; color: white; text-decoration: none; border-radius: 5px;">
                View Dashboard
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      process.env.DOCTOR_EMAIL!,
      `✅ Appointment Confirmed - ${name}`,
      doctorEmailBody
    );

    console.log("Appointment updated successfully for:", email);
  } catch (error) {
    console.error("Error handling invitee created:", error);
  }
}

/**
 * Handle when a patient cancels an appointment
 */
async function handleInviteeCanceled(payload: any) {
  try {
    const { email, name, uri: inviteeUri } = payload;

    console.log("Invitee canceled:", { email, name, inviteeUri });

    // Update appointment status
    const { db } = await connectToDatabase();
    await db.collection("patients_appointments").updateOne(
      { calendly_invitee_uri: inviteeUri },
      {
        $set: {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        },
      }
    );

    // Send cancellation email
    const patientEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #d32f2f;">Appointment Cancelled</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your medical consultation has been cancelled as requested.</p>
            <p>If you'd like to reschedule, please visit our booking page.</p>
            <p>Best regards,<br><strong>Medical Consultation Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, "Appointment Cancelled", patientEmailBody);

    // Notify doctor
    await sendEmail(
      process.env.DOCTOR_EMAIL!,
      `❌ Appointment Cancelled - ${name}`,
      `Patient ${name} (${email}) has cancelled their appointment.`
    );

    console.log("Cancellation processed for:", email);
  } catch (error) {
    console.error("Error handling invitee canceled:", error);
  }
}
