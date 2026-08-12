"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";

import {
  BoxCubeIcon, CalenderIcon, ChevronDownIcon, DollarLineIcon, 
  GridIcon, ListIcon, PageIcon, UserCircleIcon, } from "../icons/index";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

/* ---------------- ROLE-BASED MENUS ---------------- */

const sidebarMenus = {
  admin: [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/admin",
    },
    {
      icon: <UserCircleIcon />,
      name: "Client",
      path: "/admin/clients",
    },
    {
      icon: <UserCircleIcon />,
      name: "Staff",
      path: "/admin/staff",
    },
    {
      icon: <ListIcon />,
      name: "Task",
      path: "/admin/task",
    },
    {
      icon: <CalenderIcon />,
      name: "Schedule",
      path: "/admin/schedule",
    },
    {
      icon: <PageIcon />,
      name: "Policy",
      path: "/admin/policy",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/admin/profile",
    },
  ],

  staff: [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/staff",
    },
    {
      icon: <ListIcon />,
      name: "Task",
      path: "/staff/task",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/staff/profile",
    },
  ],

  clerk: [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/clerk",
    },
    {
      icon: <ListIcon />,
      name: "Task",
      path: "/clerk/task",
    },
    {
      icon: <PageIcon />,
      name: "Policy",
      path: "/clerk/policy",
    },
    {
      icon: <PageIcon />,
      name: "Deceased",
      path: "/clerk/deceased",
    },
    {
      icon: <PageIcon />,
      name: "Mortuary",
      path: "/clerk/mortuary",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/clerk/profile",
    },
  ],

  client: [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/client",
    },
    {
      icon: <BoxCubeIcon />,
      name: "Packages",
      path: "/client/packages",
    },
    {
      icon: <PageIcon />,
      name: "Policy",
      path: "/client/policy",
    },
    {
      icon: <DollarLineIcon />,
      name: "Payment",
      path: "/client/payment",
    },
    {
      icon: <UserCircleIcon />,
      name: "Profile",
      path: "/profile",
    },
  ],
};

/* ---------------- COMPONENT ---------------- */

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } =
    useSidebar();

  const pathname = usePathname();

  /* ---------------- AUTO ROLE DETECTION ---------------- */

  const role: "admin" | "staff" | "clerk" | "client" =
    pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/staff")
      ? "staff"
      : pathname.startsWith("/clerk")
      ? "clerk"
      : "client";

  const roleItems = sidebarMenus[role];

  /* ---------------- STATES ---------------- */

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [subMenuHeight, setSubMenuHeight] = useState<
    Record<string, number>
  >({});

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);

  /* ---------------- ACTIVE PATH ---------------- */

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  /* ---------------- SUBMENU ---------------- */

  const handleSubmenuToggle = (
    index: number,
    menuType: "main"
  ) => {
    setOpenSubmenu((prev) => {
      if (
        prev?.type === menuType &&
        prev?.index === index
      ) {
        return null;
      }

      return {
        type: menuType,
        index,
      };
    });
  };

  useEffect(() => {
    let matched = false;

    roleItems.forEach((nav: NavItem, index: number) => {
      nav.subItems?.forEach((sub: SubItem) => {
        if (isActive(sub.path)) {
          setOpenSubmenu({
            type: "main",
            index,
          });

          matched = true;
        }
      });
    });

    if (!matched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, roleItems]);

  useEffect(() => {
    if (!openSubmenu) return;

    const key = `${openSubmenu.type}-${openSubmenu.index}`;

    const el = subMenuRefs.current[key];

    if (el) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [key]: el.scrollHeight,
      }));
    }
  }, [openSubmenu]);

  /* ---------------- MENU RENDER ---------------- */

  const renderMenu = (
    items: NavItem[],
    type: "main"
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav: NavItem, index: number) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() =>
                handleSubmenuToggle(index, type)
              }
              className="menu-item flex items-center gap-3 w-full"
            >
              <span>{nav.icon}</span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span>{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon className="ml-auto" />
              )}
            </button>
          ) : (
            nav.path && (
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
            )
          )}

          {nav.subItems && (
            <div
              ref={(el) => {
                subMenuRefs.current[
                  `${type}-${index}`
                ] = el;
              }}
              style={{
                height:
                  openSubmenu?.index === index
                    ? subMenuHeight[
                        `${type}-${index}`
                      ]
                    : 0,
              }}
              className="overflow-hidden transition-all"
            >
              <ul className="ml-6 mt-2 space-y-2">
                {nav.subItems.map((sub: SubItem) => (
                  <li key={sub.name}>
                    <Link
                      href={sub.path}
                      className="menu-dropdown-item"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  /* ---------------- UI ---------------- */

  return (
    <aside
  className={`sidebar fixed left-0 top-0 h-screen border-r transition-all duration-300 z-50 bg-cover bg-center bg-no-repeat
    ${isExpanded || isHovered ? "w-[290px]" : "w-[90px]"}
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
    `}

      style={{backgroundColor: "#0c192d"  }}

      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO */}
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered
            ? "justify-center"
            : "justify-start px-6"
        }`}
      >
        <Link href="/">
          <Image
            src="/images/dashboardlogo.png"
            alt="Logo"
            width={140}
            height={40}
          />
        </Link>
      </div>

      {/* MENU */}
      <nav className="px-4">
        {renderMenu(roleItems, "main")}
      </nav>
    </aside>
  );
};

export default AppSidebar;