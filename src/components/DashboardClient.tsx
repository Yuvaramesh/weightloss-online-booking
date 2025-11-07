// src/components/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Appointment {
  _id: string;
  patient_name: string;
  patient_email: string;
  issues: string;
  preferred_time: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  google_meet_link?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  highPriority: number;
}

export default function DashboardClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    highPriority: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments");
      const result = await response.json();

      if (result.success && result.appointments.length > 0) {
        setAppointments(result.appointments);
        updateStats(result.appointments);
        setError("");
      } else {
        setAppointments([]);
        setStats({ total: 0, pending: 0, approved: 0, highPriority: 0 });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (appointments: Appointment[]) => {
    setStats({
      total: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      approved: appointments.filter((a) => a.status === "approved").length,
      highPriority: appointments.filter((a) => a.priority === "High").length,
    });
  };

  const approveAppointment = async (id: string) => {
    if (!confirm("Approve this appointment?")) return;

    try {
      const response = await fetch(`/api/appointments/${id}/approve`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        alert("Appointment approved! Confirmation email sent to patient.");
        loadAppointments();
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Network error: " + (err as Error).message);
    }
  };

  const rejectAppointment = async (id: string) => {
    if (
      !confirm(
        "Reject this appointment? Patient will receive a reschedule email."
      )
    )
      return;

    try {
      const response = await fetch(`/api/appointments/${id}/reject`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        alert("Appointment rejected. Reschedule email sent to patient.");
        loadAppointments();
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Network error: " + (err as Error).message);
    }
  };

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <Link
        href="/"
        className="inline-block mb-5 text-purple-600 font-semibold hover:underline"
      >
        ← Back to Booking Page
      </Link>

      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 rounded-2xl mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-1">👨‍⚕️ Doctor Dashboard</h1>
        <p className="opacity-90">
          Manage patient appointments and consultations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="text-gray-600 text-sm mb-2">Total Appointments</h3>
          <div className="text-4xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="text-gray-600 text-sm mb-2">Pending</h3>
          <div className="text-4xl font-bold text-gray-800">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="text-gray-600 text-sm mb-2">Approved</h3>
          <div className="text-4xl font-bold text-gray-800">
            {stats.approved}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="text-gray-600 text-sm mb-2">High Priority</h3>
          <div className="text-4xl font-bold text-gray-800">
            {stats.highPriority}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Patient Appointments
          </h2>
          <button
            onClick={loadAppointments}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold transition-all hover:bg-purple-700 hover:-translate-y-0.5"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-600">
            Loading appointments...
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-400">
            <h3 className="text-xl font-semibold mb-2">
              Error loading appointments
            </h3>
            <p>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg
              className="w-24 h-24 mx-auto mb-5 opacity-30"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No appointments yet</h3>
            <p>New patient bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className={`border-2 border-gray-300 rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  apt.priority === "High"
                    ? "border-l-8 border-l-red-500"
                    : apt.priority === "Medium"
                    ? "border-l-8 border-l-yellow-500"
                    : "border-l-8 border-l-green-500"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xl font-bold text-gray-800">
                    {apt.patient_name}
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-semibold uppercase ${
                      apt.priority === "High"
                        ? "bg-red-100 text-red-600"
                        : apt.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {apt.priority} Priority
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-gray-600">
                    <strong className="block text-gray-800 mb-1">
                      📧 Email
                    </strong>
                    {apt.patient_email}
                  </div>
                  <div className="text-gray-600">
                    <strong className="block text-gray-800 mb-1">
                      🕒 Preferred Time
                    </strong>
                    {new Date(apt.preferred_time).toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    <strong className="block text-gray-800 mb-1">
                      📅 Booked On
                    </strong>
                    {new Date(apt.created_at).toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    <strong className="block text-gray-800 mb-1">Status</strong>
                    <span
                      className={`inline-block px-3 py-1 rounded-2xl text-xs font-semibold uppercase ${
                        apt.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : apt.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 text-gray-900 p-4 rounded-lg mb-4">
                  <strong className="block mb-2 text-gray-800">
                    🏥 Medical Issues / Symptoms:
                  </strong>
                  {apt.issues}
                </div>

                {apt.google_meet_link && (
                  <div className="mb-4 text-gray-600">
                    <strong className="block text-gray-800 mb-1">
                      🎥 Google Meet Link:
                    </strong>
                    <a
                      href={apt.google_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      {apt.google_meet_link}
                    </a>
                  </div>
                )}

                {apt.status === "pending" && (
                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={() => approveAppointment(apt._id)}
                      className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold transition-all hover:bg-green-600"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => rejectAppointment(apt._id)}
                      className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold transition-all hover:bg-red-600"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
