type PackageCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

export default function PackageCard({
  name,
  price,
  description,
  features,
}: PackageCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900">{name}</h3>

      <p className="mt-4 text-3xl font-bold text-gray-900">{price}</p>

      <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>

      <div className="my-6 h-px bg-gray-200" />

      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-gray-700">
            <span className="font-bold">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <a
          href="/login"
          className="block rounded-md bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
        >
          View Package
        </a>
      </div>
    </div>
  );
}