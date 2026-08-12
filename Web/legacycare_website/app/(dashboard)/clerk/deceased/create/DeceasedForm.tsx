"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import { createDeceased } from "@/lib/services/deceasedServices";
import { assignStorage } from "@/lib/services/mortuaryService";
import type { CreateDeceasedRequest } from "@/types/deceased";
import type { StorageResponse } from "@/types/mortuary";

interface DeceasedFormProps {
  selectedUnit: StorageResponse;
  onBack: () => void;
}

interface FormState {
  deceasedId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  dateOfDeath: string;
  gender: string;
  causeOfDeath: string;
  policyId: string;
  dateAssigned: string;
}

function createIdentifier(
  prefix: string
): string {
  return `${prefix}-${crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

export default function DeceasedForm({
  selectedUnit,
  onBack,
}: DeceasedFormProps) {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>({
      deceasedId:
        createIdentifier("DEC"),
      fullName: "",
      idNumber: "",
      dateOfBirth: "",
      dateOfDeath: "",
      gender: "",
      causeOfDeath: "",
      policyId: "",
      dateAssigned:
        new Date()
          .toISOString()
          .split("T")[0],
    });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleChange = (
    event:
      React.ChangeEvent<
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
      >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const request:
        CreateDeceasedRequest = {
        deceasedId:
          form.deceasedId.trim(),

        fullName:
          form.fullName.trim(),

        idNumber:
          form.idNumber.trim(),

        dateOfBirth:
          form.dateOfBirth,

        dateOfDeath:
          form.dateOfDeath,

        gender:
          form.gender,

        causeOfDeath:
          form.causeOfDeath.trim() ||
          null,

        policyId:
          form.policyId.trim(),
      };

      const created =
        await createDeceased(request);

      await assignStorage({
        assignmentId:
          createIdentifier("ASN"),

        storageId:
          selectedUnit.storageId,

        deceasedId:
          created.deceasedId,

        dateAssigned:
          new Date(
            form.dateAssigned
          ).toISOString(),
      });

      router.push(
        "/clerk/deceased"
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to capture the deceased record."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComponentCard title="Capture Deceased Details">
      {/* SELECTED UNIT */}

      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Selected Storage Unit
        </h3>

        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-gray-500">
              Storage ID
            </p>

            <p className="font-medium text-gray-800">
              {selectedUnit.storageId}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Unit Number
            </p>

            <p className="font-medium text-gray-800">
              {selectedUnit.unitNumber}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Branch ID
            </p>

            <p className="font-medium text-gray-800">
              {selectedUnit.branchId}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* PERSONAL INFORMATION */}

        <section>
          <h3 className="mb-5 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-700">
            Deceased Information
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deceased ID
              </label>

              <input
                type="text"
                name="deceasedId"
                value={form.deceasedId}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ID Number
              </label>

              <input
                type="text"
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                placeholder="Enter ID number"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Gender
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              >
                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date of Birth
              </label>

              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date of Death
              </label>

              <input
                type="date"
                name="dateOfDeath"
                value={form.dateOfDeath}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cause of Death
              </label>

              <textarea
                name="causeOfDeath"
                value={form.causeOfDeath}
                onChange={handleChange}
                rows={4}
                placeholder="Enter the cause of death"
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>
        </section>

        {/* POLICY AND STORAGE */}

        <section>
          <h3 className="mb-5 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-700">
            Policy and Storage Information
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Policy ID
              </label>

              <input
                type="text"
                name="policyId"
                value={form.policyId}
                onChange={handleChange}
                placeholder="Enter related policy ID"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date Assigned
              </label>

              <input
                type="date"
                name="dateAssigned"
                value={form.dateAssigned}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assigned Unit
              </label>

              <input
                type="text"
                value={
                  selectedUnit.unitNumber
                }
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Branch ID
              </label>

              <input
                type="text"
                value={
                  selectedUnit.branchId
                }
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
              />
            </div>
          </div>
        </section>

        {/* BUTTONS */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Capturing..."
              : "Capture Deceased"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}