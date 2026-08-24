"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";

import {
  CalenderIcon,
  DollarLineIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  UserCircleIcon,
} from "../icons/index";

/* =========================================================
   ADMIN NAVIGATION ITEM
========================================================= */

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

/* =========================================================
   ADMIN MENU
========================================================= */

const adminMenu: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin/dashboard",
  },

  {
    icon: <UserCircleIcon />,
    name: "Client Management",
    path: "/admin/clients",
  },

  {
    icon: <PageIcon />,
    name: "Policy Management",
    path: "/admin/policy",
  },

  {
    icon: <ListIcon />,
    name: "Packages Management",
    path: "/admin/packages",
  },

  {
    icon: <DollarLineIcon />,
    name: "Finance Management",
    path: "/admin/payments",
  },

  {
    icon: <UserCircleIcon />,
    name: "Staff Management",
    path: "/admin/staff",
  },

  {
    icon: <GridIcon />,
    name: "Organisation Management",
    path: "/admin/branches",
  },

  {
    icon: <CalenderIcon />,
    name: "Operations Management",
    path: "/admin/schedule",
  },

  {
    icon: <PageIcon />,
    name: "Death Notifications",
    path: "/admin/death-notifications",
  },

  {
    icon: <ListIcon />,
    name: "Task Management",
    path: "/admin/task",
  },

  {
    icon: <PageIcon />,
    name: "Reports Management",
    path: "/admin/reports",
  },

  {
    icon: <UserCircleIcon />,
    name: "Profile Management",
    path: "/admin/profile",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const pathname = usePathname();

  /* =======================================================
     ADMIN ONLY
     
     Staff, Clerk and Client have their own navigation.
     Therefore this sidebar is rendered only for /admin/*
  ======================================================= */

  const isAdmin = pathname.startsWith("/admin");

  /* Do not show this sidebar for Client, Staff or Clerk */
  if (!isAdmin) {
    return null;
  }

  /* =======================================================
     ACTIVE PATH
  ======================================================= */

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  /* =======================================================
     MENU RENDER
  ======================================================= */

  const renderMenu = (items: NavItem[]) => {
    return (
      <ul className="flex flex-col gap-4">
        {items.map((nav: NavItem) => (
          <li key={nav.name}>
            <Link
              href={nav.path}
              className={`menu-item flex items-center gap-3 ${
                isActive(nav.path)
                  ? "menu-item-active"
                  : ""
              }`}
            >
              <span>{nav.icon}</span>

              {(isExpanded ||
                isHovered ||
                isMobileOpen) && (
                <span>{nav.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <aside
      className={`sidebar fixed left-0 top-0 z-50 h-screen border-r bg-cover bg-center bg-no-repeat transition-all duration-300
        ${
          isExpanded || isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
        lg:translate-x-0
      `}
      style={{
        backgroundColor: "#0c192d",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className={`flex py-6 ${
          !isExpanded && !isHovered
            ? "justify-center"
            : "justify-start px-6"
        }`}
      >
        <Link href="/admin/dashboard">
          <Image
            src="/images/dashboardlogo.png"
            alt="LegacyCare Logo"
            width={140}
            height={40}
            loading="eager"
            className={
              isExpanded || isHovered
                ? "h-[40px] w-[140px]"
                : "h-[40px] w-[40px]"
            }
          />
        </Link>
      </div>

      {/* =================================================
          ADMIN MENU
      ================================================= */}

      <nav className="px-4">
        {renderMenu(adminMenu)}
      </nav>
    </aside>
  );
};

export default AppSidebar;