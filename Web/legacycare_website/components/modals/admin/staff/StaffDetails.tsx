"use client";

import InfoRow from "@/components/reusables/InfoRow";
import {PencilIcon,TrashBinIcon,DollarLineIcon,IdCardIcon,LocationIcon,
  PhoneIcon,EnvelopeIcon,BuildingIcon,BriefCaseIcon, InfoIcon} from "@/icons";


interface StaffDetailsProps {
  staff: any;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

export default function StaffDetails({
  staff,
  onEdit,
  onActivate,
  onDeactivate,
}: StaffDetailsProps) {
  return (
    <div className="w-full rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          {/* Initials */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-semibold text-xl">
            {staff.fullName
              ?.split(" ")
              .map((name: string) => name[0])
              .join("")
              .slice(0, 2)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {staff.fullName}
              </h2>

              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium border 
                  ${staff.status === "Active"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-red-100 text-red-700 border-red-300"
                }`}
              >
                {staff.status}
              </span>

            </div>

            <p className="text-sm text-gray-500">
              Staff ID: {staff.displayStaffId}
            </p>

            <p className="text-sm text-gray-500">
              Joined: {staff.joinedDate ?? "Not Available"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* Personal Information */}
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Personal Information
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<IdCardIcon />}
            label="ID Number"
            value={staff.idNumber}
          />

          <InfoRow
            icon={<LocationIcon />}
            label="Address"
            value={staff.address}
          />

        </div>

        {/* Contact Information */}
        <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
          Contact Information
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<PhoneIcon />}
            label="Phone Number"
            value={staff.cellNo}
          />

          <InfoRow
            icon={<EnvelopeIcon />}
            label="Email Address"
            value={staff.email}
          />

        </div>

        {/* Work Information */}
        <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
          Work Information
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<BriefCaseIcon />}
            label="Role"
            value={staff.role}
          />

          <InfoRow
            icon={<DollarLineIcon />}
            label="Salary"
            value={staff.salary}
          />

          <InfoRow
            icon={<BuildingIcon />}
            label="Branch Employed"
            value={staff.branch}
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 border-t border-gray-200 p-6">

        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800"
        >
          <PencilIcon />
          Edit
        </button>

        <button
          onClick={staff.status === "Active"
            ? onDeactivate
            : onActivate
          }
          className={`flex-1 flex items-center justify-center gap-2 rounded-md border border-red-300 py-2.5 text-red-600 transition ${
          staff.status === "Active"
        ? "border border-red-300 text-red-600 hover:bg-red-50"
        : "border border-blue-300 text-blue-600 hover:bg-blue-50"}`}
          >
          {staff.status === "Active" ? (
            <TrashBinIcon />
           ) : (
            <InfoIcon />
           )}

           {staff.status === "Active"
           ? "Delete"
           : "Active Client"}
        </button>

      </div>

    </div>
  );
}
