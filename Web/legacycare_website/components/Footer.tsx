import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-xl font-bold">LegacyCare</h3>

            <p className="mt-4 text-sm leading-6 text-gray-400">
              Professional funeral care and policy management built around
              dignity, reliability and support.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Quick Links</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <Link href="/">Home</Link>
              <a href="#about">About</a>
              <a href="#services">Services</a>
              <a href="#packages">Packages</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Services</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <span>Funeral Policies</span>
              <span>Funeral Services</span>
              <span>Policy Management</span>
              <span>Family Support</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Account</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <Link href="/login">Login</Link>
              <span>Contact Us</span>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} LegacyCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}