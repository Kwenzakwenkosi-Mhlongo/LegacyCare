// File:
// Web/legacycare_website/app/(dashboard)/client/profile/page.tsx

"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import AccountInformation from "@/components/profile/AccountInformation";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import PersonalInformation from "@/components/profile/PersonalInformation";
import Security from "@/components/profile/Security";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

const PROFILE_IMAGE_STORAGE_KEY =
  "legacycare-client-profile-picture";

const MAX_PROFILE_IMAGE_SIZE =
  2 * 1024 * 1024;

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

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (typeof data === "string") {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }
  }

  return fallback;
}

function getInitials(
  fullName: string
): string {
  const names =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (names.length === 0) {
    return "LC";
  }

  if (names.length === 1) {
    return names[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${names[0][0]}${
    names[names.length - 1][0]
  }`.toUpperCase();
}

export default function ProfilePage() {
  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    profileImage,
    setProfileImage,
  ] =
    useState<string | null>(
      null
    );

  const [
    profileImageError,
    setProfileImageError,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    showChangePassword,
    setShowChangePassword,
  ] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  useEffect(() => {
    document.title =
      "My Profile | LegacyCare";
  }, []);

  useEffect(() => {
    try {
      const savedImage =
        window.localStorage.getItem(
          PROFILE_IMAGE_STORAGE_KEY
        );

      if (savedImage) {
        setProfileImage(
          savedImage
        );
      }
    } catch (storageError) {
      console.error(
        "[CLIENT PROFILE] PROFILE IMAGE STORAGE ERROR:",
        storageError
      );
    }
  }, []);

  useEffect(() => {
    async function loadProfile(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        const response =
          await apiFetch(
            `${API_BASE_URL}/User/profile`
          );

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        if (!response.ok) {
          if (
            response.status ===
            401
          ) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error(
            getErrorMessage(
              data,
              `Unable to load profile (${response.status}).`
            )
          );
        }

        if (
          !data ||
          typeof data !==
            "object"
        ) {
          throw new Error(
            "No profile information was returned."
          );
        }

        setProfile(
          data as UserProfile
        );
      } catch (err) {
        console.error(
          "[CLIENT PROFILE] ERROR:",
          err
        );

        setProfile(
          null
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    void loadProfile();
  }, []);

  async function handleChangePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response =
      await apiFetch(
        `${API_BASE_URL}/User/profile/password`,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              currentPassword,
              newPassword,
            }),
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => null
        );

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Unable to change password."
        )
      );
    }
  }

  function openProfileImagePicker(): void {
    setProfileImageError("");

    fileInputRef.current?.click();
  }

  function handleProfileImageChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    setProfileImageError("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setProfileImageError(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      MAX_PROFILE_IMAGE_SIZE
    ) {
      setProfileImageError(
        "Profile pictures must be 2 MB or smaller."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !==
        "string"
      ) {
        setProfileImageError(
          "Unable to read the selected image."
        );

        return;
      }

      try {
        window.localStorage.setItem(
          PROFILE_IMAGE_STORAGE_KEY,
          reader.result
        );

        setProfileImage(
          reader.result
        );
      } catch (storageError) {
        console.error(
          "[CLIENT PROFILE] PROFILE IMAGE SAVE ERROR:",
          storageError
        );

        setProfileImageError(
          "Unable to save the profile picture."
        );
      }
    };

    reader.onerror = () => {
      setProfileImageError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(
      file
    );
  }

  function removeProfileImage(): void {
    try {
      window.localStorage.removeItem(
        PROFILE_IMAGE_STORAGE_KEY
      );

      setProfileImage(
        null
      );

      setProfileImageError(
        ""
      );
    } catch (storageError) {
      console.error(
        "[CLIENT PROFILE] PROFILE IMAGE REMOVE ERROR:",
        storageError
      );

      setProfileImageError(
        "Unable to remove the profile picture."
      );
    }
  }

  const formattedCreatedDate =
    formatDate(
      profile?.dateCreated
    );

  const formattedLastLogin =
    profile?.lastLogin
      ? formatDate(
          profile.lastLogin
        )
      : "Never";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          LegacyCare Client Portal
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          My Profile
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">
          View your personal information,
          account details and security
          settings.
        </p>
      </section>

      {loading ? (
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />

          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />

          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />

          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      ) : null}

      {!loading &&
      error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Unable to load profile
          </h2>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </section>
      ) : null}

      {!loading &&
      !error &&
      !profile ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            No profile information was
            returned for your account.
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      profile ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="relative shrink-0">
                {profileImage ? (
                  <img
                    src={
                      profileImage
                    }
                    alt={`${profile.fullName} profile`}
                    className="h-28 w-28 rounded-full border-4 border-teal-100 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-teal-100 bg-teal-600 text-3xl font-bold text-white shadow-sm">
                    {getInitials(
                      profile.fullName
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                  Client Profile
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {
                    profile.fullName
                  }
                </h2>

                <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <button
                    type="button"
                    onClick={
                      openProfileImagePicker
                    }
                    className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    {profileImage
                      ? "Change Profile Picture"
                      : "Add Profile Picture"}
                  </button>

                  {profileImage ? (
                    <button
                      type="button"
                      onClick={
                        removeProfileImage
                      }
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Remove Picture
                    </button>
                  ) : null}
                </div>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleProfileImageChange
                  }
                  className="hidden"
                />

                {profileImageError ? (
                  <p className="mt-3 text-sm text-red-600">
                    {
                      profileImageError
                    }
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <PersonalInformation
              email={
                profile.email
              }
              phone={
                profile.cellNo
              }
              address={
                profile.address
              }
              idNumber={
                profile.idNumber
              }
            />
          </section>

          <section>
            <AccountInformation
              role={
                profile.role
              }
              status={
                profile.isActive
                  ? "Active"
                  : "Inactive"
              }
              createdDate={
                formattedCreatedDate
              }
              lastLogin={
                formattedLastLogin
              }
            />
          </section>

          <section>
            <Security
              onChangePassword={() =>
                setShowChangePassword(
                  true
                )
              }
            />
          </section>
        </div>
      ) : null}

      {showChangePassword ? (
        <ChangePasswordModal
          onClose={() =>
            setShowChangePassword(
              false
            )
          }
          onSubmit={
            handleChangePassword
          }
        />
      ) : null}
    </div>
  );
}