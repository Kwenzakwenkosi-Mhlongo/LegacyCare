"use client";

import { useState, useEffect } from "react";
import EditableRow from "@/components/reusables/EditableRow";
import {
    PencilIcon, IdCardIcon, LocationIcon, PhoneIcon, EnvelopeIcon,
    UserIcon, BuildingIcon, BriefCaseIcon, CheckLineIcon, CloseLineIcon
} from "@/icons";
import Select from "@/components/form/Select";
import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import TextArea from "@/components/form/input/TextArea";
import { StaffValidationErrors, validateStaff } from "@/lib/validators/staffValidator";
import { getBranches } from "@/lib/branchService";

interface EditStaffDetailsProps {
    staff: any;
    onSave: (updatedStaff: any) => void;
    onCancel: () => void;
}

export default function EditStaffDetails({
    staff,
    onSave,
    onCancel
}: EditStaffDetailsProps) {
    const [form, setForm] = useState({
        staffId: staff.staffId,
        displayStaffId: staff.displayStaffId,
        initials: staff.initials,
        fullName: staff.fullName,
        idNumber: staff.idNumber,
        cellphone: staff.cellNo,
        email: staff.email,
        address: staff.address,
        status: staff.status,
        role: staff.role,
        salary: staff.salary,
        branchId: staff.branchId
    });

    const [errors, setErrors] = useState<StaffValidationErrors>({});
    const [branches, setBranches] = useState<any[]>([]);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const data = await getBranches();
                setBranches(data);
            } catch (error) {
                console.error("Failed to load branches", error)
            }
        };
        loadBranches();
    }, []);
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));

        setErrors(prev => ({
            ...prev,
            [name]: undefined,
        }));
    };

    const handleSave = () => {
        const validationErrors = validateStaff({
            fullName: form.fullName,
            idNumber: form.idNumber,
            cellphone: form.cellphone,
            email: form.email,
            street: form.address,
            role: form.role,
            branchId: form.branchId
        });
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        onSave(form);
    };

    return (
        <div className="w-full rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="p-6 pb-4">

                <div className="flex items-center gap-4">

                    <div className="flex-1">

                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-semibold text-xl">
                                {form.initials}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Edit Staff Details
                                </h2>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {form.fullName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Staff ID: {form.displayStaffId}
                                </p>
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${form.status === "Active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-600"
                                    }`}
                                >
                                    {form.status}
                                </span>
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Personal Information */}
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Personal Information
                </h3>

                <div className="space-y-5">
                    {/* Staff Name */}
                    <EditableRow
                        icon={<UserIcon />}
                        label="Client Name"
                    >
                        <DefaultInputs
                            label=""
                            name="fullName"
                            value={form.fullName}
                            onChange={handleInputChange}
                        />
                        {errors.fullName && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.fullName}
                            </p>
                        )}
                    </EditableRow>

                    {/* ID Number */}
                    <EditableRow
                        icon={<IdCardIcon />}
                        label="ID Number"
                    >
                        <DefaultInputs
                            label=""
                            name="idNumber"
                            value={form.idNumber}
                            onChange={handleInputChange}
                        />
                        {errors.idNumber && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.idNumber}
                            </p>
                        )}
                    </EditableRow>

                    {/*Address*/}

                    <EditableRow
                        icon={<LocationIcon />}
                        label="Street Address"
                    >
                        <TextArea
                            rows={5}
                            value={form.address}
                            onChange={(value) => {
                                setForm({
                                    ...form,
                                    address: value,
                                });

                                setErrors({
                                    ...errors,
                                    street: undefined,
                                });
                            }
                            }
                        />
                        {errors.street && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.street}
                            </p>
                        )}
                    </EditableRow>

                    {/*Contact Details*/}
                    <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                        Contact Information
                    </h3>

                    {/* Phone Number */}
                    <EditableRow
                        icon={<PhoneIcon />}
                        label="Phone Number"
                    >
                        <DefaultInputs
                            label=""
                            name="cellphone"
                            value={form.cellphone}
                            onChange={handleInputChange}
                        />
                        {errors.cellphone && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.cellphone}
                            </p>
                        )}
                    </EditableRow>

                    {/*Email Address*/}
                    <EditableRow
                        icon={<EnvelopeIcon />}
                        label="Email Address"
                    >
                        <DefaultInputs
                            label=""
                            name="email"
                            value={form.email}
                            onChange={handleInputChange}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </EditableRow>

                    {/*Status*/}
                    <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                        User Status
                    </h3>

                    {/*Status*/}
                    <EditableRow
                        icon={<CheckLineIcon />}
                        label="Status"
                    >
                        <Select
                            defaultValue={form.status}
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    status: value,
                                })
                            }
                            options={[
                                {
                                    value: "Active",
                                    label: "Active",
                                },
                                {
                                    value: "Inactive",
                                    label: "Inactive",
                                },
                            ]}
                        />
                    </EditableRow>

                    {/*Work Details*/}
                    <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                        Work Information
                    </h3>

                    {/*Status*/}
                    <EditableRow
                        icon={<BriefCaseIcon />}
                        label="Role"
                    >
                        <Select
                            defaultValue={form.role}
                            onChange={(value) => {
                                setForm({
                                    ...form,
                                    role: value,
                                })
                                setErrors((prev) => ({
                                    ...prev,
                                    role: undefined,
                                }));
                            }}
                            options={[
                                {
                                    value: "Admin",
                                    label: "Admin",
                                },
                                {
                                    value: "Clerk",
                                    label: "Clerk",
                                },
                                {
                                    value: "Driver",
                                    label: "Driver",
                                },
                                {
                                    value: "MortuaryAttendant",
                                    label: "Mortuary Attendant",
                                },
                                {
                                    value: "GraveDigger",
                                    label: "Grave Digger",
                                },
                                {
                                    value: "OnSiteStaff",
                                    label: "On-Site Staff",
                                },
                            ]}
                        />
                        {errors.role && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.role}
                            </p>
                        )}
                    </EditableRow>

                    {/*Branch Employed*/}
                    <EditableRow
                        icon={<BuildingIcon />}
                        label="Branch Employed"
                    >
                        <Select
                            defaultValue={form.branchId}
                            onChange={(value) => {
                                setForm({
                                    ...form,
                                    branchId: value,
                                });
                                setErrors((prev) => ({
                                    ...prev,
                                    branchId: undefined,
                                }));
                            }}
                            options={branches.map((branch) => ({
                                value: branch.branchId,
                                label: branch.branchName,
                            }))}

                        />
                        {errors.branchId && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.branchId}
                            </p>
                        )}
                    </EditableRow>
                </div>
            </div>

            {/*Footer- Buttons*/}
            <div className="flex gap-3 border-t border-gray-200 p-6">

                <button
                    onClick={onCancel}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 text-gray-700 transition hover:bg-gray-100"
                >
                    <CloseLineIcon />
                    Cancel
                </button>

                <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800"
                >
                    <PencilIcon />
                    Save
                </button>
            </div>
        </div>
    );
}

