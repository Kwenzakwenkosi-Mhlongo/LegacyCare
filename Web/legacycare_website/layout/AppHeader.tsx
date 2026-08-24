"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { getRole } from "@/lib/auth";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   SEARCH ITEM
========================================================= */

interface SearchItem {
  name: string;
  path: string;
  keywords: string[];
}

/* =========================================================
   SEARCH ITEMS
========================================================= */

const searchItems: Record<string, SearchItem[]> = {
  Admin: [
    { name: "Dashboard", path: "/admin/dashboard", keywords: ["dashboard", "home", "overview"] },
    { name: "Tasks", path: "/admin/tasks", keywords: ["task", "tasks", "manage"] },
    { name: "Users", path: "/admin/users", keywords: ["user", "users", "accounts"] },
    { name: "Clients", path: "/admin/clients", keywords: ["client", "clients"] },
    { name: "Staff", path: "/admin/staff", keywords: ["staff", "employee", "employees"] },
    { name: "Policies", path: "/admin/policies", keywords: ["policy", "policies"] },
    { name: "Packages", path: "/admin/packages", keywords: ["package", "packages"] },
    { name: "Beneficiaries", path: "/admin/beneficiaries", keywords: ["beneficiary", "beneficiaries"] },
    { name: "Payments", path: "/admin/payments", keywords: ["payment", "payments"] },
    { name: "Invoices", path: "/admin/invoices", keywords: ["invoice", "invoices"] },
  ],

  Staff: [
    { name: "Dashboard", path: "/staff", keywords: ["dashboard", "home", "overview"] },
    { name: "Tasks", path: "/staff/tasks", keywords: ["task", "tasks", "manage"] },
    { name: "Clients", path: "/staff/clients", keywords: ["client", "clients"] },
    { name: "Policies", path: "/staff/policies", keywords: ["policy", "policies"] },
    { name: "Packages", path: "/staff/packages", keywords: ["package", "packages"] },
    { name: "Beneficiaries", path: "/staff/beneficiaries", keywords: ["beneficiary", "beneficiaries"] },
    { name: "Payments", path: "/staff/payments", keywords: ["payment", "payments"] },
  ],

  Clerk: [
    { name: "Dashboard", path: "/clerk", keywords: ["dashboard", "home", "overview"] },
    { name: "Tasks", path: "/clerk/tasks", keywords: ["task", "tasks", "manage"] },
    { name: "Clients", path: "/clerk/clients", keywords: ["client", "clients"] },
    { name: "Policies", path: "/clerk/policies", keywords: ["policy", "policies"] },
    { name: "Packages", path: "/clerk/packages", keywords: ["package", "packages"] },
    { name: "Beneficiaries", path: "/clerk/beneficiaries", keywords: ["beneficiary", "beneficiaries"] },
    { name: "Payments", path: "/clerk/payments", keywords: ["payment", "payments"] },
  ],

  Client: [
    { name: "Dashboard", path: "/client", keywords: ["dashboard", "home", "overview"] },
    { name: "Profile", path: "/client/profile", keywords: ["profile", "account", "my profile"] },
    { name: "Policies", path: "/client/policies", keywords: ["policy", "policies"] },
    { name: "Beneficiaries", path: "/client/beneficiaries", keywords: ["beneficiary", "beneficiaries"] },
    { name: "Payments", path: "/client/payments", keywords: ["payment", "payments"] },
  ],
};

/* =========================================================
   SEARCH ICON (shared)
========================================================= */

const SearchIcon: React.FC = () => (
  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
    <svg
      className="fill-white/50"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
      />
    </svg>
  </span>
);

/* =========================================================
   REUSABLE SEARCH BOX
   (Used for both the desktop inline search and the mobile
   expandable search bar so the logic never has to be
   duplicated.)
========================================================= */

interface SearchBoxProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  showResults: boolean;
  results: SearchItem[];
  onSelect: (item: SearchItem) => void;
  widthClass?: string;
  showKbdHint?: boolean;
  autoFocus?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  inputRef,
  containerRef,
  value,
  onChange,
  onFocus,
  onSubmit,
  showResults,
  results,
  onSelect,
  widthClass = "",
  showKbdHint = true,
  autoFocus = false,
}) => {
  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={onSubmit}>
        <div className="relative">
          <SearchIcon />

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            autoFocus={autoFocus}
            placeholder="Search or type command..."
            autoComplete="off"
            spellCheck={false}
            className={`h-11 w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-12 ${
              showKbdHint ? "pr-14" : "pr-4"
            } text-sm text-white shadow-theme-xs outline-none placeholder:text-white/40 focus:border-brand-400 focus:bg-white/10 focus:ring-3 focus:ring-brand-500/20 ${widthClass}`}
          />

          {showKbdHint && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(event) => {
                event.preventDefault();
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-white/15 bg-white/[0.06] px-[7px] py-[4.5px] text-xs text-white/60"
            >
              <span>⌘</span>
              <span>K</span>
            </button>
          )}

          {/* RESULTS DROPDOWN — only ever shown once a query exists */}
          {showResults && (
            <div className="absolute left-0 top-14 z-[999999] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
              {results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-2">
                  <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Search Results
                  </div>

                  {results.map((item, index) => (
                    <button
                      key={item.path}
                      type="button"
                      // onMouseDown (not onClick) so the input never blurs
                      // before we've had a chance to navigate.
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(item);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{item.path}</p>
                      </div>

                      {index === 0 && (
                        <span className="text-xs text-gray-400">Enter</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-7 text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    No results found
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    No page matches &quot;{value}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

/* =========================================================
   APP HEADER
========================================================= */

const AppHeader: React.FC = () => {
  const router = useRouter();

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  /* =======================================================
     STATES
  ======================================================= */

  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const [role, setRole] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [showSearchResults, setShowSearchResults] = useState(false);

  // Whether the mobile expandable search bar is open.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);

  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  /* =======================================================
     GET USER ROLE (unchanged — exact existing auth setup)
  ======================================================= */

  useEffect(() => {
    const currentRole = getRole();
    setRole(currentRole);
  }, []);

  /* =======================================================
     BASE PATH (unchanged)
  ======================================================= */

  const getBasePath = () => {
    switch (role) {
      case "Admin":
        return "/admin";
      case "Staff":
        return "/staff";
      case "Clerk":
        return "/clerk";
      case "Client":
        return "/client";
      default:
        return "/";
    }
  };

  const basePath = getBasePath();

  /* =======================================================
     CURRENT ROLE SEARCH ITEMS
  ======================================================= */

  const currentSearchItems = role && searchItems[role] ? searchItems[role] : [];

  /* =======================================================
     FILTER SEARCH RESULTS
  ======================================================= */

  const filteredResults =
    search.trim() === ""
      ? []
      : currentSearchItems.filter((item) => {
          const text = `${item.name} ${item.path} ${item.keywords.join(" ")}`.toLowerCase();
          return text.includes(search.trim().toLowerCase());
        });

  /* =======================================================
     SEARCH INPUT
  ======================================================= */

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    setShowSearchResults(value.trim() !== "");
  };

  const handleSearchFocus = () => {
    if (search.trim() !== "") {
      setShowSearchResults(true);
    }
  };

  /* =======================================================
     OPEN RESULT
  ======================================================= */

  const openSearchResult = (item: SearchItem) => {
    setSearch("");
    setShowSearchResults(false);
    setMobileSearchOpen(false);

    desktopInputRef.current?.blur();
    mobileInputRef.current?.blur();

    router.push(item.path);
  };

  /* =======================================================
     SEARCH FORM SUBMIT (Enter key)
  ======================================================= */

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (search.trim() === "") {
      return;
    }

    if (filteredResults.length > 0) {
      openSearchResult(filteredResults[0]);
    } else {
      // Confirm the query even with no matches — surface "No results found".
      setShowSearchResults(true);
    }
  };

  /* =======================================================
     MOBILE SEARCH TOGGLE
  ======================================================= */

  const toggleMobileSearch = () => {
    setMobileSearchOpen((previous) => {
      const next = !previous;
      if (!next) {
        setShowSearchResults(false);
      }
      return next;
    });
  };

  // Autofocus the mobile input once its row has mounted.
  useEffect(() => {
    if (mobileSearchOpen) {
      const id = window.setTimeout(() => mobileInputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [mobileSearchOpen]);

  /* =======================================================
     KEYBOARD SHORTCUTS
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      /* CTRL + K / COMMAND + K */
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (window.innerWidth >= 1024) {
          desktopInputRef.current?.focus();
        } else {
          setMobileSearchOpen(true);
        }

        return;
      }

      /* ESCAPE */
      if (event.key === "Escape") {
        setSearch("");
        setShowSearchResults(false);
        setMobileSearchOpen(false);

        desktopInputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* =======================================================
     CLOSE ON CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const activeContainer = mobileSearchOpen
        ? mobileContainerRef.current
        : desktopContainerRef.current;

      if (activeContainer && !activeContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
        if (mobileSearchOpen) {
          setMobileSearchOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSearchOpen]);

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  /* =======================================================
     MOBILE APPLICATION MENU
  ======================================================= */

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((previous) => !previous);
  };

  /* =======================================================
     HEADER
  ======================================================= */

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col bg-[#0c192d] dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* SIDEBAR BUTTON */}

          <button
            type="button"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:h-11 lg:w-11"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 17.4865 17.0105 17.0116 16.7187L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.25 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.41422 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* MOBILE LOGO */}

          <Link href={basePath} className="lg:hidden">
            <Image
              width={154}
              height={32}
              className="dark:hidden"
              src="/images/logo/logo.svg"
              alt="Logo"
            />
            <Image
              width={154}
              height={32}
              className="hidden dark:block"
              src="/images/logo/logo-dark.svg"
              alt="Logo"
            />
          </Link>

          {/* MOBILE: SEARCH TOGGLE + APPLICATION MENU */}

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleMobileSearch}
              aria-label="Toggle Search"
              className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-white/5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  className="fill-current"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleApplicationMenu}
              aria-label="Open application menu"
              className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {/* =================================================
              DESKTOP SEARCH (inline, always visible lg+)
          ================================================= */}

          <div className="hidden lg:block">
            <SearchBox
              inputRef={desktopInputRef}
              containerRef={desktopContainerRef}
              value={search}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onSubmit={handleSearchSubmit}
              showResults={!mobileSearchOpen && showSearchResults}
              results={filteredResults}
              onSelect={openSearchResult}
              widthClass="xl:w-[430px]"
              showKbdHint
            />
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>

          <UserDropdown />
        </div>
      </div>

      {/* =====================================================
          MOBILE SEARCH BAR (expands below the top row)
      ===================================================== */}

      {mobileSearchOpen && (
        <div className="border-b border-gray-800 bg-[#0c192d] px-3 py-3 lg:hidden">
          <SearchBox
            inputRef={mobileInputRef}
            containerRef={mobileContainerRef}
            value={search}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onSubmit={handleSearchSubmit}
            showResults={showSearchResults}
            results={filteredResults}
            onSelect={openSearchResult}
            widthClass="w-full"
            showKbdHint={false}
            autoFocus
          />
        </div>
      )}
    </header>
  );
};

export default AppHeader;
