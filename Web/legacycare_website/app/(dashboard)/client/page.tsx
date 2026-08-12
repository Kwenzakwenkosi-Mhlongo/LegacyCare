"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ClientPage() {
  useEffect(() => {
    document.title = "Client Dashboard";
  }, []);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Client Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back to your LegacyCare account.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* POLICY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                My Policy
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Active
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              🛡️
            </div>
          </div>

          <Link
            href="/client/policies"
            className="mt-4 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View Policy →
          </Link>
        </div>

        {/* BENEFICIARIES */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Beneficiaries
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                View
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              👥
            </div>
          </div>

          <Link
            href="/client/beneficiaries"
            className="mt-4 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Manage Beneficiaries →
          </Link>
        </div>

        {/* PAYMENTS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Payments
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                View
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              💳
            </div>
          </div>

          <Link
            href="/client/payments"
            className="mt-4 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View Payments →
          </Link>
        </div>
      </div>

      {/* POLICY SUMMARY */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            My Policy
          </h2>
          <p className="text-sm text-gray-500">
            Your current LegacyCare policy information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Policy Status</p>
            <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Package</p>
            <p className="mt-2 font-medium text-gray-900">
              My Funeral Package
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Monthly Premium</p>
            <p className="mt-2 font-medium text-gray-900">
              R0.00
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/client/policies"
            className="inline-flex rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            View Full Policy
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Quickly access your LegacyCare services.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/client/profile"
            className="rounded-xl border border-gray-200 p-4 transition hover:border-teal-500 hover:bg-teal-50"
          >
            <p className="font-medium text-gray-900">
              My Profile
            </p>
            <p className="mt-1 text-sm text-gray-500">
              View your details
            </p>
          </Link>

          <Link
            href="/client/policies"
            className="rounded-xl border border-gray-200 p-4 transition hover:border-teal-500 hover:bg-teal-50"
          >
            <p className="font-medium text-gray-900">
              My Policies
            </p>
            <p className="mt-1 text-sm text-gray-500">
              View policy information
            </p>
          </Link>

          <Link
            href="/client/beneficiaries"
            className="rounded-xl border border-gray-200 p-4 transition hover:border-teal-500 hover:bg-teal-50"
          >
            <p className="font-medium text-gray-900">
              Beneficiaries
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Manage beneficiaries
            </p>
          </Link>

          <Link
            href="/client/payments"
            className="rounded-xl border border-gray-200 p-4 transition hover:border-teal-500 hover:bg-teal-50"
          >
            <p className="font-medium text-gray-900">
              Payments
            </p>
            <p className="mt-1 text-sm text-gray-500">
              View payment history
            </p>
          </Link>
        </div>
      </div>

      {/* BOOKINGS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Bookings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your LegacyCare bookings.
            </p>
          </div>

          <Link
            href="/client/bookings"
            className="inline-flex w-fit rounded-lg border border-teal-600 px-5 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50"
          >
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}