import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Hero */}
      <section className="bg-gray-900 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            About LegacyCare
          </p>

          <h1 className="max-w-3xl text-4xl font-bold md:text-6xl">
            Professional care. Lasting legacy.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            LegacyCare is a modern funeral services management platform
            designed to make funeral care, policy management and client
            services simpler and more accessible.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center">

          <div className="min-h-[400px] rounded-2xl bg-gray-100" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Who We Are
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Making funeral care simpler
            </h2>

            <p className="mt-6 leading-8 text-gray-600">
              LegacyCare brings funeral service management into one
              organised platform. Our system helps funeral organisations
              manage clients, policies, staff, schedules, tasks and
              other important services.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              We focus on making everyday operations easier while giving
              clients convenient access to the services and information
              they need.
            </p>
          </div>

        </div>
      </section>

      {/* Mission */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Our Mission
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Care supported by technology
          </h2>

          <p className="mt-6 leading-8 text-gray-600">
            Our mission is to provide a reliable digital platform that
            helps funeral service organisations deliver better,
            more organised and accessible services to their clients.
          </p>

        </div>
      </section>

      {/* What We Offer */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              What We Offer
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              One platform for essential services
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold">
                Policy Management
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                Manage funeral policies and keep important client
                information organised.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold">
                Client Services
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                Give clients convenient access to their information,
                services and requests.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold">
                Business Management
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                Help staff manage tasks, schedules, branches and
                day-to-day funeral service operations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Login CTA */}
      <section className="bg-gray-900 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold md:text-4xl">
          Ready to use LegacyCare?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-gray-300">
          Access the LegacyCare platform to manage your services
          and information.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-white px-7 py-3 font-semibold text-gray-900 transition hover:bg-gray-200"
        >
          Login to LegacyCare
        </Link>
      </section>

    </main>
  );
}