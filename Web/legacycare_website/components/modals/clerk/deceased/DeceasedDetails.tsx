"use client";

import {
  useState,
} from "react";

import InfoRow from "@/components/reusables/InfoRow";

import {
  BuildingIcon,
  CalenderIcon,
  FileIcon,
  InfoIcon,
  LockIcon,
  UserIcon,
  PencilIcon,
} from "@/icons";

import type {
  DeceasedDetailsView,
} from "@/types/deceased";

interface DeceasedDetailsProps {
  deceased: DeceasedDetailsView;
  onEdit: () => void;
  onRelease?: () => void;
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not Available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-ZA"
  );
}

export default function DeceasedDetails({
  deceased,
  onEdit,
  onRelease,
}: DeceasedDetailsProps) {
  const [
    activeSection,
    setActiveSection,
  ] = useState<
    "deceased" | "policy"
  >("deceased");

  const statusLabel =
    deceased.isReleased
      ? "Released"
      : "In Mortuary";

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* HEADER */}

      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {deceased.fullName}
              </h2>

              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                  deceased.isReleased
                    ? "border-gray-300 bg-gray-100 text-gray-700"
                    : "border-yellow-300 bg-yellow-100 text-yellow-700"
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Deceased ID:{" "}
              {deceased.deceasedId}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}

      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() =>
              setActiveSection(
                "deceased"
              )
            }
            className={`pb-3 text-sm font-medium transition-colors ${
              activeSection ===
              "deceased"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Deceased
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                "policy"
              )
            }
            className={`pb-3 text-sm font-medium transition-colors ${
              activeSection === "policy"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Related Policy
          </button>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-6">
        {activeSection ===
          "deceased" && (
          <>
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Deceased Details
            </h3>

            <div className="space-y-4">
              <InfoRow
                icon={<FileIcon />}
                label="Deceased ID"
                value={
                  deceased.deceasedId
                }
              />

              <InfoRow
                icon={<UserIcon />}
                label="Full Name"
                value={
                  deceased.fullName
                }
              />

              <InfoRow
                icon={<FileIcon />}
                label="ID Number"
                value={
                  deceased.idNumber
                }
              />

              <InfoRow
                icon={<UserIcon />}
                label="Gender"
                value={deceased.gender}
              />

              <InfoRow
                icon={<CalenderIcon />}
                label="Date of Birth"
                value={formatDate(
                  deceased.dateOfBirth
                )}
              />

              <InfoRow
                icon={<CalenderIcon />}
                label="Date of Death"
                value={formatDate(
                  deceased.dateOfDeath
                )}
              />

              <InfoRow
                icon={<InfoIcon />}
                label="Cause of Death"
                value={
                  deceased.causeOfDeath ??
                  "Not Provided"
                }
              />

              <InfoRow
                icon={<InfoIcon />}
                label="Status"
                value={statusLabel}
              />
            </div>

            <h3 className="mb-4 mt-8 text-sm font-semibold text-gray-700">
              Storage Details
            </h3>

            <div className="space-y-4">
              <InfoRow
                icon={<LockIcon />}
                label="Storage ID"
                value={
                  deceased.storageId ??
                  "Not Assigned"
                }
              />

              <InfoRow
                icon={<BuildingIcon />}
                label="Unit Number"
                value={
                  deceased.unitNumber ??
                  "Not Assigned"
                }
              />

              <InfoRow
                icon={<CalenderIcon />}
                label="Date Assigned"
                value={formatDate(
                  deceased.dateAssigned
                )}
              />

              <InfoRow
                icon={<CalenderIcon />}
                label="Date Removed"
                value={
                  deceased.dateRemoved
                    ? formatDate(
                        deceased.dateRemoved
                      )
                    : "Still Assigned"
                }
              />
            </div>
          </>
        )}

        {activeSection ===
          "policy" && (
          <>
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Policy Details
            </h3>

            <div className="space-y-4">
              <InfoRow
                icon={<FileIcon />}
                label="Policy ID"
                value={
                  deceased.policyId
                }
              />
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}

      <div className="flex gap-3 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800"
        >
          <PencilIcon />

          Edit Details
        </button>

        {!deceased.isReleased &&
          onRelease && (
            <button
              type="button"
              onClick={onRelease}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-teal-700 py-2.5 text-teal-700 transition hover:bg-teal-50"
            >
              <InfoIcon />

              Release
            </button>
          )}
      </div>
    </div>
  );
}