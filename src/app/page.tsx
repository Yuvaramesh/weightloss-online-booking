// src/app/page.tsx
"use client";

import BookingForm from "../components/BookingForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <BookingForm />
    </main>
  );
}
