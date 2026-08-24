"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PersonalInformation from "@/components/profile/PersonalInformation";
import AccountInformation from "@/components/profile/AccountInformation";
import Security from "@/components/profile/Security";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  idNumber: string;
  cellNo: string;
  address: string;
  dateCreated: string;
  lastLogin: string | null;
  isActive: boolean;
}

interface DashboardStats {
  totalClients: number;
  totalStaff: number;
  totalEvents: number;
  totalTasks: number;
  totalPolicies?: number;
  totalPayments?: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    document.title = "My Profile";

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        // Fetch profile
        const profileResponse = await apiFetch(`${API_BASE_URL}/User/profile`);
        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to load profile");
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch dashboard stats
        const statsResponse = await apiFetch(`${API_BASE_URL}/Dashboard/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log("Dashboard stats response:", statsData);
         setStats({
  totalClients: statsData.totalClients || 0,
  totalStaff: statsData.totalStaff || 0,
  totalEvents: statsData.totalEvents || 0,
  totalTasks: statsData.totalTasks || 0,
  totalPolicies: statsData.totalPolicies || 0,
  totalPayments: statsData.totalPayments || 0,
});
        } else {
          console.warn(
            "Dashboard stats request failed with status:",
            statsResponse.status
          );
          // If dashboard endpoint doesn't exist, use fallback
          setStats({
            totalClients: 0,
            totalStaff: 0,
            totalEvents: 0,
            totalTasks: 0,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unknown error occurred while loading the profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const response = await apiFetch(`${API_BASE_URL}/User/profile/password`, {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Unable to load profile</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-700">
          No profile information was returned.
        </div>
      </div>
    );
  }

  const formattedCreatedDate = profile.dateCreated
    ? new Date(profile.dateCreated).toLocaleDateString()
    : "N/A";

  const formattedLastLogin = profile.lastLogin
    ? new Date(profile.lastLogin).toLocaleDateString()
    : "Never";

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="My Profile" />

      {/* All remaining cards stacked as a single vertical list */}
      <div className="flex flex-col gap-6">
        <PersonalInformation
          
          email={profile.email}
          phone={profile.cellNo}
          address={profile.address}
          idNumber={profile.idNumber}
        />

        <AccountInformation
          role={profile.role}
          status={profile.isActive ? "Active" : "Inactive"}
          createdDate={formattedCreatedDate}
          lastLogin={formattedLastLogin}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {stats?.totalEvents ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {stats?.totalTasks ?? 0}
          </p>
        </div>

        {/* Security always last */}
        <Security onChangePassword={() => setShowChangePassword(true)} />
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSubmit={handleChangePassword}
        />
      )}
    </div>
  );
}
