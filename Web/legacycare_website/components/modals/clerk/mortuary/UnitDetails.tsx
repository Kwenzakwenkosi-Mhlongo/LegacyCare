"use client";

import InfoRow from "@/components/reusables/InfoRow";

import {
  ListIcon,
  InfoIcon,
  CoffinIcon,
  CalenderIcon,
} from "@/icons";

import type {
  MortuaryUnitView,
} from "@/types/mortuary";

interface UnitDetailsProps {
  unit: MortuaryUnitView;
}

function formatDate(
  date?: string | null
): string {
  if (!date) {
    return "Not Available";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-ZA"
  );
}

export default function UnitDetails({
  unit,
}: UnitDetailsProps) {
  const availabilityLabel =
    unit.isAvailable
      ? "Available"
      : "Occupied";

  const occupantName =
    unit.deceasedName ??
    "Not Occupied";

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* HEADER */}

      <div className="p-6 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Unit {unit.unitNumber}
            </h2>

            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                unit.isAvailable
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-yellow-300 bg-yellow-100 text-yellow-700"
              }`}
            >
              {availabilityLabel}
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Storage ID:{" "}
            {unit.storageId}
          </p>

          <p className="text-sm text-gray-500">
            Occupied By:{" "}
            {occupantName}
          </p>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Unit Information
        </h3>

        <div className="space-y-4">
          <InfoRow
            icon={<ListIcon />}
            label="Unit Number"
            value={unit.unitNumber}
          />

          <InfoRow
            icon={<InfoIcon />}
            label="Availability"
            value={
              availabilityLabel
            }
          />

          <InfoRow
            icon={<InfoIcon />}
            label="Branch ID"
            value={unit.branchId}
          />
        </div>

        {!unit.isAvailable && (
          <>
            <h3 className="mb-4 mt-8 text-sm font-semibold text-gray-700">
              Current Occupant
            </h3>

            <div className="space-y-4">
              <InfoRow
                icon={<CoffinIcon />}
                label="Deceased Name"
                value={occupantName}
              />

              <InfoRow
                icon={<InfoIcon />}
                label="Deceased ID"
                value={
                  unit.deceasedId ??
                  "Not Available"
                }
              />

              <InfoRow
                icon={<CalenderIcon />}
                label="Date Assigned"
                value={formatDate(
                  unit.dateAssigned
                )}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}