// src/app/page.tsx
"use client";

import BookingForm from "../components/BookingForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
      <BookingForm />
    </main>
  );
}
