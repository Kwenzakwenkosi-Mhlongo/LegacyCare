import Button from "./Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-100">
      <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            LegacyCare Funeral Services
          </p>

          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
            Honouring lives.
            <br />
            Supporting families.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Professional funeral services and policy management created to
            support families with dignity, care and peace of mind.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/login">Get Started</Button>

            <Button href="#services" variant="secondary">
              Explore Our Services
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-[450px] items-center justify-center overflow-hidden rounded-2xl bg-gray-300">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-500">LegacyCare</p>
            <p className="mt-3 text-gray-600">
              Professional care. Lasting legacy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}