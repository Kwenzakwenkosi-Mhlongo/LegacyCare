"use client";

import { PencilIcon, TrashBinIcon, EnvelopeIcon, PhoneIcon, IdCardIcon, LocationIcon, InfoIcon, } from "@/icons";
import InfoRow from "@/components/reusables/InfoRow";

interface ClientDetailsProps {
  client: any;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}


export default function ClientDetails({
  client,
  onEdit,
  onActivate,
  onDeactivate,
}: ClientDetailsProps) {
  return (

    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <div className="relative p-6 pb-4">
        {/* Initials + Full Name + Status */}
        <div className="flex items-center gap-4">
          {/* Initials */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-semibold text-xl">
            {client.initials}
          </div>
          <div className="flex-1">
            {/* Full Name + Status */}
            <div className="flex items-center gap-3">
              {/* Full Name */}
              <h2 className="text-lg font-semibold text-gray-800">
                {client.fullName}
              </h2>
              {/* Status */}
              <span 
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium 
                ${client.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
            }`}
              >
                {client.status}
              </span>
            </div>
            {/* Client ID */}
            <p className="text-sm text-gray-500">
              Client ID: {client.displayClientId}
            </p>
            {/* Registeration Date */}
            <p className="text-sm text-gray-500">
              Registered: {client.registered}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* Personal Details */}
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Personal Information</h3>
        <div className="space-y-4">
          {/*ID Number*/}
          <InfoRow
            icon={<IdCardIcon />}
            label="ID Number"
            value={client.idNumber}
          />

          {/*Address*/}
          <InfoRow
            icon={<LocationIcon />}
            label="Address"
            value={client.address}
          />
        </div>

        {/* Contact Details */}
        <h3 className=" mt-8 mb-4 text-sm font-semibold text-gray-700">Contact Information</h3>
        <div className="space-y-4">
          {/* Phone Number */}
          <InfoRow
            icon={<PhoneIcon />}
            label="Phone Number"
            value={client.cellNo}
          />
          {/* Email Address */}
          <InfoRow
            icon={<EnvelopeIcon />}
            label="Email Address"
            value={client.email}
          />
        </div>
      </div>

      {/* Edit & Delete Buttons */}
      <div className="flex gap-3 border-t border-gray-200 p-6">
        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800">
          <PencilIcon />
          Edit
        </button>
        {/* Delete Button */}
        <button
          onClick={client.status === "Active"
            ? onDeactivate
            : onActivate
          }
          className={`flex-1 flex items-center justify-center gap-2 rounded-md border border-red-300 py-2.5 text-red-600 transition ${
          client.status === "Active"
        ? "border border-red-300 text-red-600 hover:bg-red-50"
        : "border border-blue-300 text-blue-600 hover:bg-blue-50"}`}
          >
          {client.status === "Active" ? (
            <TrashBinIcon />
           ) : (
            <InfoIcon />
           )}

           {client.status === "Active"
           ? "Delete"
           : "Active Client"}
        </button>
      </div>
    </div>
  );

}
