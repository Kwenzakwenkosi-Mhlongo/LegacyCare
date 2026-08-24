"use client";

import { usePathname } from "next/navigation";

import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";
import Footer from "@/components/footer/Footer";
import Backdrop from "@/layout/Backdrop";

import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex bg-[#F5F7FA]">
      <AppSidebar />

      <Backdrop />

      <div className={`flex-1 transition-all ${mainContentMargin}`}>
        <AppHeader />

        <main className="p-4 md:p-6">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /*
   * CLIENT PAGES
   *
   * Client has its own sidebar/layout.
   * Therefore, do NOT render the parent dashboard
   * sidebar or header here.
   */
  const isClientPage = pathname.startsWith("/client");

  if (isClientPage) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }

  /*
   * ADMIN / STAFF / OTHER DASHBOARD PAGES
   *
   * Keep the existing dashboard sidebar and header.
   */
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </SidebarProvider>
    </ProtectedRoute>
  );
}