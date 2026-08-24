"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    {
      name: "Dashboard",
      href: "/client",
    },
    {
      name: "My Policies",
      href: "/client/policies",
    },
    {
      name: "Beneficiaries",
      href: "/client/beneficiaries",
    },
    {
      name: "Payments",
      href: "/client/payments",
    },
    {
      name: "Bookings",
      href: "/client/bookings",
    },
    {
      name: "Service Requests",
      href: "/client/service-requests",
    },
    {
      name: "My Profile",
      href: "/client/profile",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    sessionStorage.clear();

    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CLIENT NAVIGATION */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex min-h-20 items-center justify-between gap-4">

            {/* LOGO */}
            <Link
              href="/client"
              className="flex-shrink-0"
            >
              <h1 className="text-xl font-bold text-teal-700">
                LegacyCare
              </h1>

              <p className="text-xs text-gray-500">
                Client Portal
              </p>
            </Link>

            {/* NAVIGATION */}
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/client"
                    ? pathname === "/client"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex-shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>

          {/* MOBILE NAVIGATION */}
          <nav className="flex gap-1 overflow-x-auto pb-3 lg:hidden">
            {navigation.map((item) => {
              const isActive =
                item.href === "/client"
                  ? pathname === "/client"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}