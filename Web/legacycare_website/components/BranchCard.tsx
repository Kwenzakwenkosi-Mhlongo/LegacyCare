type BranchCardProps = {
  name: string;
  address: string;
  phone?: string;
};

export default function BranchCard({
  name,
  address,
  phone,
}: BranchCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-7">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        📍
      </div>

      <h3 className="text-xl font-semibold text-gray-900">{name}</h3>

      <p className="mt-3 leading-7 text-gray-600">{address}</p>

      {phone && (
        <p className="mt-3 text-sm font-medium text-gray-900">{phone}</p>
      )}
    </div>
  );
}