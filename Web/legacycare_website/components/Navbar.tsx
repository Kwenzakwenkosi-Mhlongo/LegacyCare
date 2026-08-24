import Link from "next/link";
import Button from "./Button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold tracking-wide">
          LegacyCare
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium hover:text-gray-600">
            Home
          </Link>

          <a href="#about" className="text-sm font-medium hover:text-gray-600">
            About
          </a>

          <a href="#services" className="text-sm font-medium hover:text-gray-600">
            Services
          </a>

          <a href="#contact" className="text-sm font-medium hover:text-gray-600">
            Contact
          </a>

          <Button href="/login">Login</Button>
        </nav>

        <div className="md:hidden">
          <Button href="/login" className="px-4 py-2">
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}