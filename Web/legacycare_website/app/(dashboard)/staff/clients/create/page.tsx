"use client";

import React, { useState, } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/notifications/NotificationContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { ClientValidationErrors, validateClient } from "@/lib/validators/clientValidator";
import { createClient } from "@/lib/clientService";
import { ChevronLeftIcon } from "@/icons";

export default function CreateClientPage() {
 /* ---------------- STATE(S) ---------------- */
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    idNumber: "",
    cellphone: "",
    email: "",
    street: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ClientValidationErrors>({});
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

    const validationErrors = validateClient(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try{
      const response = await createClient({
        fullName: form.fullName,
        idNumber: form.idNumber,
        cellNo: form.cellphone,
        email: form.email,
        address: form.street,
      });

      addNotification({
      title: "New Client Added",
      message: `${form.fullName} has successfully been registered.`,
      type: "success",
    });

    //redirect after successful client creation
    router.push("/admin/clients");
    }
    catch (error: any) {
      const message = error ?.response?.data??
                      error?.message?? "Unable to create new client";
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
      title: "New Client Addition Failed",
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
      <PageBreadcrumb pageTitle="Create Client" />

      <form 
      className="space-y-6"
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

        {/* ================= SUBMIT ================= */}
        <div className="flex justify-end">
          <Button type="submit"
          disabled={isSubmitting}>{
            isSubmitting 
            ? "Creating Client..."
            : "Create Client"
          }
          </Button>
        </div>
      </form>
    </div>
  );
}