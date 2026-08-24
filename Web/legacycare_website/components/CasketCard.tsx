import Image from "next/image";

type CasketCardProps = {
  name: string;
  image: string;
};

export default function CasketCard({ name, image }: CasketCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative h-64 bg-gray-100">
        <Image
          src={image}
          alt={`${name} casket`}
          fill
          className="object-contain p-4"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold">{name}</h3>

        <p className="mt-2 text-sm text-gray-600">
          View this casket option through LegacyCare funeral services.
        </p>
      </div>
    </div>
  );
}