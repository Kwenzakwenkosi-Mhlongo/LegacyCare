"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/notifications/NotificationContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { StaffValidationErrors, validateStaff } from "@/lib/validators/staffValidator";
import { createStaff } from "@/lib/staffService";
import { getBranches } from "@/lib/branchService";
import { ChevronLeftIcon } from "@/icons";

export default function CreateStaffPage() {
  /* ---------------- STATE(S) ---------------- */
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    idNumber: "",
    cellphone: "",
    email: "",
    street: "",
    role: "",
    branchId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<StaffValidationErrors>({});
  const [branches, setBranches] = useState<any[]>([]);

useEffect(() => {
  const loadBranches = async () => {
    const data = await getBranches();
    setBranches(data);
  };

  loadBranches();
}, []);

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>
      ) => {
        e.preventDefault();
    
        const validationErrors = validateStaff(form);
    
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
    
        setErrors({});
        setIsSubmitting(true);
        try{
          const response = await createStaff({
            fullName: form.fullName,
            idNumber: form.idNumber,
            cellNo: form.cellphone,
            email: form.email,
            address: form.street,
            staffRole: form.role,
            branchId: form.branchId
          });
    
          addNotification({
          title: "New Staff Added",
          message: `${form.fullName} has successfully been registered.`,
          type: "success",
        });
    
        //redirect after successful staff creation
        router.push("/admin/staff");
        }
        catch (error: any) {
          const message = error ?.response?.data??
                          error?.message?? "Unable to create new staff";
          if (message.includes("Email")) {
            setErrors((prev) => ({
              ...prev,
              email: message,
            }));
          }
          else if (message.includes("ID")) {
            setErrors((prev) => ({
              ...prev,
              idNumber: message,
            }));
          }
          else if (message.includes("Cellphone")) {
            setErrors((prev) => ({
              ...prev,
              cellphone: message,
            }));
          }
          else {
            addNotification({
          title: "New Staff Addition Failed",
          message,
          type: "error",
        });
          } 
        }
        finally {
          setIsSubmitting(false);
        }
      };

  return (
    <div className="space-y-6">

      <button
      type="button"
      onClick={() => router.back()}
      className="rounded-full p-2 hover: bg-gray-100 transition"
      >
        <ChevronLeftIcon />
      </button>

      {/* PAGE HEADER */}
      <PageBreadcrumb pageTitle="Create Staff" />

      <form className="space-y-6"
      onSubmit={handleSubmit}>

        {/* ================= PERSONAL INFO ================= */}
        <ComponentCard title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Full Name */}
            <DefaultInputs
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
            {errors.fullName &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.fullName}
              </p>
            )}

            {/* ID Number */}
            <DefaultInputs
              label="ID Number"
              name="idNumber"
              value={form.idNumber}
              onChange={handleChange}
              placeholder="South African ID"
            />
            {errors.idNumber &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.idNumber}
              </p>
            )}
          </div>
        </ComponentCard>

        {/* ================= CONTACT INFO ================= */}
        <ComponentCard title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <DefaultInputs
              label="Cellphone Number"
              name="cellphone"
              value={form.cellphone}
              onChange={handleChange}
              placeholder="0712345678"
            />
            {errors.cellphone &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.cellphone}
              </p>
            )}

            <DefaultInputs
              label="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
            />
            {errors.email &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}

          </div>
        </ComponentCard>

        {/* ================= ADDRESS ================= */}
        <ComponentCard title="Address Information">
          <div className="grid grid-cols-1 gap-4">

            <div>
              <label className="text-sm text-gray-600">Street Address</label>
              <TextArea
                value={form.street}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, street: val, }));
                  setErrors((prev) => ({ ...prev, street: undefined }))
                }}
                rows={4}
              />
              {errors.street &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.street}
              </p>
            )}
            </div>
          </div>
        </ComponentCard>

        {/* ================= JOB DESCRIPTION ================= */}
        <ComponentCard title="Role Information">
          <div className="grid grid-cols-1 gap-4">

            <div>
              <label className="text-sm text-gray-600">Branch</label>

            <Select
  defaultValue={form.branchId}
  onChange={(value) => {
    setForm({
      ...form,
      branchId: value,
    })
    setErrors((prev) => ({
                    ...prev,
                    role: undefined,
                  }));
  }}
  
  options={branches.map((branch) => ({
    value: branch.branchId,
    label: branch.branchName,
  }))}

/>
{errors.branchId &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.branchId}
              </p>
            )}
</div>

            <div>
              <label className="text-sm text-gray-600">Role</label>

              <Select
                defaultValue={form.role}
                onChange={(value) => {
                  setForm({
                    ...form,
                    role: value,
                  });

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
              {errors.role &&(
              <p className="mt-1 text-sm text-red-600">
                {errors.role}
              </p>
            )}
            </div>
          </div>
        </ComponentCard>

        {/* ================= SUBMIT ================= */}
        <div className="flex justify-end">
          <Button type="submit"
          disabled={isSubmitting}>{
            isSubmitting 
            ? "Creating Staff..."
            : "Create Staff"
          }
          </Button>
        </div>

      </form>
    </div>
  );
}