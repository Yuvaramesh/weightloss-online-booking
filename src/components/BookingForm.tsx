"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, Mail, FileText, LogOut } from "lucide-react";

// Type definitions
interface FormData {
  patient_name: string;
  patient_email: string;
  issues: string;
  preferred_time: string;
}

interface Message {
  text: string;
  type: string;
}

interface TimeSlot {
  time: string;
  datetime: string;
  display: string;
}

interface ScheduleInterval {
  from: string;
  to: string;
}

interface ScheduleRule {
  type: "wday" | "date";
  intervals: ScheduleInterval[];
  wday?: string;
  date?: string;
}

interface AvailabilitySchedule {
  uri: string;
  default: boolean;
  name: string;
  user: string;
  timezone: string;
  rules: ScheduleRule[];
}

export default function BookingFormWithSlots() {
  const [userName, setUserName] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    patient_name: "",
    patient_email: "",
    issues: "",
    preferred_time: "",
  });
  const [message, setMessage] = useState<Message>({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calendly availability state
  const [availabilitySchedules, setAvailabilitySchedules] = useState<
    AvailabilitySchedule[]
  >([]);
  const [selectedSchedule, setSelectedSchedule] =
    useState<AvailabilitySchedule | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
    fetchAvailabilitySchedules();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/user");
      const result = await response.json();

      if (result.success) {
        setUserName(result.user.name);
        setFormData((prev) => ({
          ...prev,
          patient_name: result.user.name,
          patient_email: result.user.email,
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const fetchAvailabilitySchedules = async (): Promise<void> => {
    setLoadingSlots(true);
    try {
      const response = await fetch("/api/availability");
      const result = await response.json();

      console.log("API Response:", result); // Debug log

      if (result.success && result.data && result.data.collection) {
        setAvailabilitySchedules(result.data.collection);

        // Auto-select default schedule
        const defaultSchedule = result.data.collection.find(
          (s: AvailabilitySchedule) => s.default
        );
        if (defaultSchedule) {
          setSelectedSchedule(defaultSchedule);
          generateAllAvailableSlots(defaultSchedule);
        }
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setMessage({
        text: "Failed to load availability. Please refresh the page.",
        type: "error",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateAllAvailableSlots = (schedule: AvailabilitySchedule): void => {
    const slots: TimeSlot[] = [];
    const today = new Date();

    // Generate slots for next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const dateStr = date.toISOString().split("T")[0];

      // Find rules for this day
      schedule.rules.forEach((rule) => {
        if (
          rule.type === "wday" &&
          rule.wday === dayName &&
          rule.intervals.length > 0
        ) {
          rule.intervals.forEach((interval) => {
            const [fromHour, fromMin] = interval.from.split(":");
            const [toHour, toMin] = interval.to.split(":");

            // Generate 30-minute slots
            let currentHour = parseInt(fromHour);
            let currentMin = parseInt(fromMin);
            const endHour = parseInt(toHour);
            const endMin = parseInt(toMin);

            while (
              currentHour < endHour ||
              (currentHour === endHour && currentMin < endMin)
            ) {
              const timeStr = `${String(currentHour).padStart(2, "0")}:${String(
                currentMin
              ).padStart(2, "0")}`;
              const datetime = `${dateStr}T${timeStr}`;

              slots.push({
                time: timeStr,
                datetime: datetime,
                display: formatDateTime(date, timeStr),
              });

              // Add 30 minutes
              currentMin += 30;
              if (currentMin >= 60) {
                currentMin = 0;
                currentHour += 1;
              }
            }
          });
        }
      });
    }

    setAvailableSlots(slots);
  };

  const formatDateTime = (date: Date, time: string): string => {
    const [hour, min] = time.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;

    const dayStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return `${dayStr} - ${displayHour}:${min} ${ampm}`;
  };

  const handleSlotSelect = (slot: TimeSlot): void => {
    setSelectedSlot(slot);
    setFormData((prev) => ({
      ...prev,
      preferred_time: slot.datetime,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.issues || !formData.preferred_time) {
      setMessage({ text: "Please fill in all required fields", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/book-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: result.message, type: "success" });
        setFormData((prev) => ({
          ...prev,
          issues: "",
          preferred_time: "",
        }));
        setSelectedSlot(null);
      } else {
        setMessage({
          text: result.message || "An error occurred. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Network error. Please check your connection and try again.",
        type: "error",
      });
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              Book Appointment
            </h1>
            {userName && (
              <p className="text-gray-600 text-sm mt-1">Welcome, {userName}!</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <p className="text-center text-gray-600 mb-8 text-sm">
          Book your appointment with our experienced doctors
        </p>

        {message.text && (
          <div
            className={`p-4 rounded-lg mb-5 text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.patient_name}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base bg-gray-50 cursor-not-allowed text-gray-800"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Patient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.patient_email}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base bg-gray-50 cursor-not-allowed text-gray-800"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Medical Issues / Symptoms <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issues"
              value={formData.issues}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issues: e.target.value }))
              }
              placeholder="Describe your symptoms or medical concerns in detail"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base transition-all resize-y focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-gray-800"
            />
          </div>

          {/* Schedule Selection - Only show if multiple schedules */}
          {availabilitySchedules.length > 1 && (
            <div className="mb-6">
              <label className="block text-gray-800 font-semibold mb-2 text-sm">
                Select Schedule
              </label>
              <select
                value={selectedSchedule?.uri || ""}
                onChange={(e) => {
                  const schedule = availabilitySchedules.find(
                    (s) => s.uri === e.target.value
                  );
                  setSelectedSchedule(schedule || null);
                  if (schedule) {
                    generateAllAvailableSlots(schedule);
                  }
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-gray-800"
              >
                {availabilitySchedules.map((schedule) => (
                  <option key={schedule.uri} value={schedule.uri}>
                    {schedule.name} {schedule.default ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Slot Selection */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time Slot <span className="text-red-500">*</span>
            </label>

            {loadingSlots ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-gray-600">Loading available slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-gray-600">No available slots found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Please contact support
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 text-left ${
                      selectedSlot?.datetime === slot.datetime
                        ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-semibold">
                Selected Appointment:
              </p>
              <p className="text-purple-900 mt-1">
                {new Date(selectedSlot.datetime).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedSlot.display.split(" - ")[1]}
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSlot}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Submitting..." : "Book Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
