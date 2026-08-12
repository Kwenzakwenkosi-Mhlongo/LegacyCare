"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { UserCircleIcon, LogoutIcon } from "@/icons";
import LogoutConfirmation from "@/components/modals/confirmation/LogoutConfirmation";
import { logout } from "@/lib/auth";

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutModal,setLogoutModal] = useState(false);

function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
  e.stopPropagation();
  setIsOpen((prev) => !prev);
}

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    setLogoutModal(false);
      logout();
      router.replace("/");
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown} 
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-cyan-100 flex items-center justify-center font-semibold text-cyan-700">
          MJ
        </span>

        <span className="block mr-1 font-medium text-white">Musharof</span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            Musharof Chowdhury
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            randomuser@pimjo.com
          </span>
        </div>

        <div className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <DropdownItem
            onItemClick={closeDropdown}
            tag="a"
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <UserCircleIcon
            className="fill-gray-200 group-hover:fill-gray-500 dark:fill-gray-500 dark:group-hover:fill-gray-400 size-6"/>
            View profile
          </DropdownItem>

        </div>
        <DropdownItem
        onItemClick={() => setLogoutModal(true)}
        tag="button"
        className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
          <LogoutIcon className="h-6 w-6 fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"/>
          Logout
        </DropdownItem>
      </Dropdown>

      <LogoutConfirmation
      isOpen={logoutModal}
      onCancel={()=>setLogoutModal(false)}
      onConfirm={handleLogout}
   />
    </div>
  );
}