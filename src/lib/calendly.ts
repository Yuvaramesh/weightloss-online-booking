// src/lib/calendly.ts
const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_SCHEDULING_URL =
  "https://calendly.com/yuvi-10qbit/15-minute-medical-consultation";

interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: string;
  cancel_url: string;
  reschedule_url: string;
}

interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  location: {
    type: string;
    join_url?: string;
  };
}

/**
 * Create a Calendly booking by generating a personalized scheduling link
 * Since direct booking via API requires webhook setup, we'll provide the scheduling URL
 */
export async function createCalendlyBooking(
  name: string,
  email: string,
  startTime: string
) {
  try {
    if (!CALENDLY_API_KEY) {
      console.warn(
        "Calendly API key not configured - using standard scheduling URL"
      );
      return {
        success: true,
        scheduling_url: CALENDLY_SCHEDULING_URL,
        message: "Please use the scheduling link to book your appointment",
      };
    }

    // Add query parameters to pre-fill invitee information
    const schedulingUrl = new URL(CALENDLY_SCHEDULING_URL);
    schedulingUrl.searchParams.set("name", name);
    schedulingUrl.searchParams.set("email", email);

    // Try to set a specific date if possible (format: YYYY-MM-DD)
    const preferredDate = startTime.split("T")[0];
    schedulingUrl.searchParams.set("date", preferredDate);

    return {
      success: true,
      scheduling_url: schedulingUrl.toString(),
      message: "Calendly scheduling link generated with pre-filled information",
    };
  } catch (error) {
    console.error("Calendly error:", error);
    return {
      success: false,
      error: (error as Error).message,
      scheduling_url: CALENDLY_SCHEDULING_URL,
    };
  }
}

/**
 * Get invitee details from a scheduled event
 */
export async function getCalendlyInvitee(
  inviteeUri: string
): Promise<CalendlyInvitee | null> {
  try {
    if (!CALENDLY_API_KEY) {
      console.warn("Calendly API key not configured");
      return null;
    }

    const response = await fetch(inviteeUri, {
      headers: {
        Authorization: `Bearer ${CALENDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Calendly invitee");
    }

    const data = await response.json();
    return data.resource as CalendlyInvitee;
  } catch (error) {
    console.error("Error fetching Calendly invitee:", error);
    return null;
  }
}

/**
 * Get scheduled event details including Google Meet link
 */
export async function getCalendlyEvent(
  eventUri: string
): Promise<CalendlyScheduledEvent | null> {
  try {
    if (!CALENDLY_API_KEY) {
      console.warn("Calendly API key not configured");
      return null;
    }

    const response = await fetch(eventUri, {
      headers: {
        Authorization: `Bearer ${CALENDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Calendly event");
    }

    const data = await response.json();
    return data.resource as CalendlyScheduledEvent;
  } catch (error) {
    console.error("Error fetching Calendly event:", error);
    return null;
  }
}

/**
 * Cancel a Calendly invitee (cancels their booking)
 */
export async function cancelCalendlyInvitee(
  inviteeUri: string,
  reason?: string
) {
  try {
    if (!CALENDLY_API_KEY) {
      throw new Error("Calendly API key not configured");
    }

    const response = await fetch(`${inviteeUri}/cancellation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CALENDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: reason || "Appointment cancelled by doctor",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to cancel: ${errorData.message || "Unknown error"}`
      );
    }

    return { success: true, message: "Booking cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling Calendly invitee:", error);
    throw error;
  }
}
