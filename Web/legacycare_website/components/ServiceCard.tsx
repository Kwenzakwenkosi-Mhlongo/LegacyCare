
import Image from "next/image";

type ServiceCardProps = {
  title: string;
  description: string;
  image: string;
};

export default function ServiceCard({
  title,
  description,
  image,
}: ServiceCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-7">
        <h3 className="text-xl font-semibold text-gray-900">
          {title}
        </h3>

        <p className="mt-3 leading-7 text-gray-600">
          {description}
        </p>

        <a
          href="#contact"
          className="mt-5 inline-block text-sm font-semibold text-gray-900 hover:underline"
        >
          Learn more →
        </a>
      </div>
    </div>
  );
}
