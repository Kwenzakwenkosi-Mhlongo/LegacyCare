
import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";
import CasketCard from "@/components/CasketCard";

import ServiceCard from "@/components/ServiceCard";


const caskets = [
  { name: "Black Casket", image: "/images/login/blackcasket.jpg" },
  { name: "Brownfish", image: "/images/login/brownfish.jpg" },
  { name: "Casket 1", image: "/images/login/casket 1.jpg" },
  { name: "Custom", image: "/images/login/custom.jpg" },
  { name: "Fish 1", image: "/images/login/fish1.jpg" },
  { name: "Glass", image: "/images/login/glass.jpg" },
  { name: "Gold White", image: "/images/login/goldwhite.jpg" },
  { name: "Green", image: "/images/login/green.jpg" },
  { name: "Silver", image: "/images/login/silver.jpg" },
  { name: "White Casket", image: "/images/login/white casket.jpg" },
  { name: "Blackfish", image: "/images/login/blackfish.jpg" },
  { name: "Gold", image: "/images/login/gold.jpg" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold tracking-wide">
            LegacyCare
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm font-medium hover:text-gray-600">
              Home
            </Link>

            <a href="#about" className="text-sm font-medium hover:text-gray-600">
              About
            </a>

            <a href="#services" className="text-sm font-medium hover:text-gray-600">
              Services
            </a>

            <a href="#packages" className="text-sm font-medium hover:text-gray-600">
              Packages
            </a>

            <a href="#caskets" className="text-sm font-medium hover:text-gray-600">
              Caskets
            </a>

            <a href="#branches" className="text-sm font-medium hover:text-gray-600">
              Branches
            </a>

            <a href="#contact" className="text-sm font-medium hover:text-gray-600">
              Contact
            </a>

            <Link
              href="/login"
              className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Login
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Login
          </Link>
        </div>
      </nav>

{/* Hero */}
<section className="bg-gray-50">
  <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
    <div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        LegacyCare
      </p>

      <h1 className="text-4xl font-bold leading-tight md:text-6xl">
        Caring for your legacy,
        <br />
        every step of the way.
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
        Professional funeral care and policy management designed to
        provide support, protection and peace of mind for you and your
        loved ones.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="#contact"
          className="rounded-md border border-gray-300 bg-white px-6 py-3 font-semibold hover:bg-gray-100"
        >
          Need a Quote?
        </a>
      </div>
    </div>

    <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-gray-200 p-10">
      <img
        src="/images/logo.png"
        alt="LegacyCare"
        className="max-h-64 w-auto object-contain"
      />
    </div>
  </div>
</section>



{/* Services */}
<section id="services" className="bg-gray-50 py-24">
  <div className="mx-auto max-w-7xl px-6">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        Our Services
      </p>

      <h2 className="mt-3 text-3xl font-bold md:text-4xl">
        Professional funeral services
      </h2>

      <p className="mt-5 leading-8 text-gray-600">
        LegacyCare provides professional funeral services and support
        designed to help families during every stage of the funeral
        process.
      </p>
    </div>

    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <ServiceCard
        title="Funeral Service"
        description="Complete funeral arrangements and professional support to help families during their time of need."
        image="/images/services/funeral-service.jpg"
      />

      <ServiceCard
        title="Funeral Cover"
        description="Funeral policy solutions designed to provide financial protection and support for you and your loved ones."
        image="/images/services/funeral-cover.jpg"
      />

      <ServiceCard
        title="Caskets"
        description="A selection of caskets to help families choose an appropriate option for their loved one's arrangements."
        image="/images/services/caskets.jpg"
      />

      <ServiceCard
        title="Repatriation"
        description="Professional assistance with the transportation of a deceased person to their required destination."
        image="/images/services/repatriation.jpg"
      />

      <ServiceCard
        title="Pre-planning"
        description="Plan funeral arrangements in advance and make important decisions easier for your family."
        image="/images/services/pre-planning.jpg"
      />

      <ServiceCard
        title="Family Support"
        description="Guidance and assistance for families throughout the funeral arrangement and policy process."
        image="/images/services/family-support.jpg"
      />
    </div>
  </div>
</section>


      {/* Packages */}
      <section id="packages" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Our Packages
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Protection for you and your family.
            </h2>

            <p className="mt-4 text-gray-600">
              Explore funeral policy options designed to provide support and
              protection for individuals and families.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Essential</h3>
              <p className="mt-3 text-gray-600">
                Basic funeral protection for individuals and families.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>• Funeral policy management</li>
                <li>• Member support</li>
                <li>• Policy information</li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Family</h3>
              <p className="mt-3 text-gray-600">
                Protection designed for families and dependants.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>• Family coverage</li>
                <li>• Policy management</li>
                <li>• Funeral support</li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Premium</h3>
              <p className="mt-3 text-gray-600">
                Extended protection and additional support.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>• Extended coverage</li>
                <li>• Priority support</li>
                <li>• Policy management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Caskets */}
     {/* Caskets */}
<section id="caskets" className="py-24">
  <div className="mx-auto max-w-7xl px-6">
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        Our Caskets
      </p>

      <h2 className="mt-3 text-3xl font-bold md:text-4xl">
        Casket options
      </h2>

      <p className="mt-4 text-gray-600">
        Explore our range of casket options available through LegacyCare.
      </p>
    </div>

    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {caskets.map((casket) => (
        <CasketCard
          key={casket.name}
          name={casket.name}
          image={casket.image}
        />
      ))}
    </div>
  </div>
</section>

      {/* Branches */}
      <section id="branches" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Our Branches
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Find a LegacyCare branch.
            </h2>

            <p className="mt-4 text-gray-600">
              Our branches are available to assist clients and families.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Head Office</h3>
              <p className="mt-3 text-gray-600">LegacyCare Head Office</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Newcastle Branch</h3>
              <p className="mt-3 text-gray-600">
                Newcastle, KwaZulu-Natal
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold">Johannesburg Branch</h3>
              <p className="mt-3 text-gray-600">Johannesburg, Gauteng</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-gray-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div className="min-h-[350px] rounded-2xl bg-gray-200" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              About LegacyCare
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Built around care and reliability.
            </h2>

            <p className="mt-6 leading-8 text-gray-600">
              LegacyCare is a platform focused on helping funeral service
              organisations manage their operations while providing clients
              with convenient access to their policies and services.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              Our goal is to make the management process simpler, more
              organised and accessible.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-block rounded-md bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-700"
            >
              Access LegacyCare
            </Link>
          </div>
        </div>
      </section>

      
{/* Contact */}
<section id="contact" className="py-24">
  <div className="mx-auto max-w-4xl px-6">
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        Contact Us
      </p>

      <h2 className="mt-3 text-3xl font-bold md:text-4xl">
        Request a quote or more information.
      </h2>

      <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-600">
        Tell us what you need and our LegacyCare team will get back to you
        with more information about our funeral services and packages.
      </p>
    </div>

    <div className="mt-10">
      <QuoteForm />
    </div>
  </div>
</section>
```

      {/* Footer */}
      <footer className="bg-gray-900 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
          <div>
            <p className="text-xl font-bold">LegacyCare</p>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Professional care. Lasting legacy.
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Funeral care and policy management designed to support families
              when it matters most.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Quick Links</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#about" className="hover:text-white">About</a>
              <a href="#services" className="hover:text-white">Services</a>
              <a href="#packages" className="hover:text-white">Packages</a>
              <a href="#caskets" className="hover:text-white">Caskets</a>
              <a href="#branches" className="hover:text-white">Branches</a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Services</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <span>Funeral Policies</span>
              <span>Funeral Services</span>
              <span>Policy Management</span>
              <span>Family Support</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Contact</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-400">
              <p>LegacyCare Head Office</p>
              <p>Newcastle, KwaZulu-Natal</p>
              <p>Johannesburg, Gauteng</p>
              <p>Available to assist clients and families.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-gray-800 px-6 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LegacyCare. All rights reserved.</p>

          <Link href="/login" className="hover:text-white">
            Login to LegacyCare
          </Link>
        </div>
      </footer>
    </main>
  );
}

