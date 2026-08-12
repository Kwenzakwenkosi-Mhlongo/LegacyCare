"use client";

import InfoRow from "../reusables/InfoRow";
import { UserIcon, EnvelopeIcon, PhoneIcon, IdCardIcon, LocationIcon } from "@/icons";

interface PersonalInformationProps {
    email: string;
    phone: string;
    address: string;
    idNumber: string;
}

export default function PersonalInformation({
    email,
    phone,
    address,
    idNumber,
}: PersonalInformationProps){
    return(
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/*Heading */}
            <h2  className="mb-6 text-lg font-semibold text-gray-900">
                Personal Information
            </h2>

            {/*Information */}
            <div className="space-y-5">

                          <InfoRow
                            icon={<EnvelopeIcon />}
                            label="Email"
                            value={email}
                          />

                          <InfoRow
                            icon={<PhoneIcon />}
                            label="Phone Number"
                            value={phone}
                          />

                          <InfoRow
                            icon={<LocationIcon />}
                            label="Address"
                            value={address}
                          />

                          <InfoRow
                            icon={<IdCardIcon />}
                            label="ID Number"
                            value={idNumber}
                          />
            </div>
        </div>

    )
}