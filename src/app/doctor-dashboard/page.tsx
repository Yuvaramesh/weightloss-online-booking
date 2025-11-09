// src/app/doctor-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardClient from "../../components/DashboardClient";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user");
      const result = await response.json();

      if (result.success) {
        if (result.user.isDoctor) {
          setIsAuthorized(true);
        } else {
          // Not a doctor, redirect to booking page
          router.push("/");
        }
      } else {
        // Not authenticated, redirect to login
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div key={"Asadfsdfa"} className="text-gray-700 text-xl">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <DashboardClient />;
}
