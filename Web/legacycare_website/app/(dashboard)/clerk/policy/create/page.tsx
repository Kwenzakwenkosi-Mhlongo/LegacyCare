"use client";

import React, { useEffect, useState } from "react";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";

import { useNotifications } from "@/components/notifications/NotificationContext";

import { getClients } from "@/lib/clientService";
import { getPackages } from "@/lib/packageService";
import { createPolicy } from "@/lib/policyService";

import type { Client } from "@/types/client";
import type { Package } from "@/types/package";
import { useRouter } from "next/navigation";

interface BeneficiaryForm {
  fullName: string;
  idNumber: string;
  relationship: string;
}

interface PolicyForm {
  userId: string;
  packageId: string;
  startDate: string;
  beneficiaries: BeneficiaryForm[];
}

const relationshipOptions = [
  { value: "0", label: "Spouse" },
  { value: "1", label: "Child" },
  { value: "2", label: "Parent" },
  { value: "3", label: "Sibling" },
  { value: "4", label: "Grand Parent" },
  { value: "5", label: "Other" },
];

const emptyBeneficiary: BeneficiaryForm = {
  fullName: "",
  idNumber: "",
  relationship: "",
};

export default function CreatePolicyPage() {
  const { addNotification } = useNotifications();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<PolicyForm>({
    userId: "",
    packageId: "",
    startDate: "",
    beneficiaries: [{ ...emptyBeneficiary }],
  });

  /* ---------------- LOAD CLIENTS AND PACKAGES ---------------- */

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        const [clientData, packageData] = await Promise.all([
          getClients(),
          getPackages(),
        ]);

        setClients(clientData);
        setPackages(packageData);
      } catch (error: any) {
        const message =
          error?.message ??
          "Clients and packages could not be loaded.";

        addNotification({
          title: "Policy Form Loading Failed",
          message,
          type: "error",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [addNotification]);

  /* ---------------- HANDLE BENEFICIARY ---------------- */

  const handleBeneficiaryChange = (
    index: number,
    field: keyof BeneficiaryForm,
    value: string
  ) => {
    setForm((previousForm) => {
      const updatedBeneficiaries = [
        ...previousForm.beneficiaries,
      ];

      updatedBeneficiaries[index] = {
        ...updatedBeneficiaries[index],
        [field]: value,
      };

      return {
        ...previousForm,
        beneficiaries: updatedBeneficiaries,
      };
    });
  };

  const addBeneficiary = () => {
    setForm((previousForm) => ({
      ...previousForm,
      beneficiaries: [
        ...previousForm.beneficiaries,
        { ...emptyBeneficiary },
      ],
    }));
  };

  const removeBeneficiary = (index: number) => {
    setForm((previousForm) => ({
      ...previousForm,
      beneficiaries: previousForm.beneficiaries.filter(
        (_, beneficiaryIndex) => beneficiaryIndex !== index
      ),
    }));
  };

  /* ---------------- VALIDATE FORM ---------------- */

  const validateForm = () => {
    if (!form.userId) {
      return "Please select a client.";
    }

    if (!form.packageId) {
      return "Please select a package.";
    }

    if (!form.startDate) {
      return "Please select a policy start date.";
    }

    if (form.beneficiaries.length === 0) {
      return "Please add at least one beneficiary.";
    }

    for (
      let index = 0;
      index < form.beneficiaries.length;
      index++
    ) {
      const beneficiary = form.beneficiaries[index];

      if (!beneficiary.fullName.trim()) {
        return `Please enter the full name for beneficiary ${
          index + 1
        }.`;
      }

      if (!beneficiary.idNumber.trim()) {
        return `Please enter the ID number for beneficiary ${
          index + 1
        }.`;
      }

      if (!beneficiary.relationship) {
        return `Please select the relationship for beneficiary ${
          index + 1
        }.`;
      }
    }

    return "";
  };

  /* ---------------- HANDLE SUBMIT ---------------- */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      addNotification({
        title: "Policy Creation Failed",
        message: validationMessage,
        type: "error",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const selectedClient = clients.find(
        (client) => client.userId === form.userId
      );

      await createPolicy({
        userId: form.userId,
        packageId: form.packageId,
        startDate: form.startDate,
        beneficiaries: form.beneficiaries.map(
          (beneficiary) => ({
            fullName: beneficiary.fullName.trim(),
            idNumber: beneficiary.idNumber.trim(),
            relationship: Number(
              beneficiary.relationship
            ),
          })
        ),
      });

      addNotification({
        title: "New Policy Added",
        message: selectedClient
          ? `A policy for ${selectedClient.user.fullName} has successfully been created.`
          : "The policy has successfully been created.",
        type: "success",
      });
      router.push("/admin/policy");

      setForm({
        userId: "",
        packageId: "",
        startDate: "",
        beneficiaries: [{ ...emptyBeneficiary }],
      });
    } catch (error: any) {
      const message =
        error?.message ??
        "The policy could not be created.";

      addNotification({
        title: "New Policy Addition Failed",
        message,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageBreadcrumb pageTitle="Create Policy" />

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ================= CLIENT DETAILS ================= */}

        <ComponentCard title="Client Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">
                Related Client
              </label>

              <Select
                options={clients.map((client) => ({
                  value: client.userId,
                  label: `${client.displayClientId} ${client.user.fullName}`,
                }))}
                placeholder={
                  isLoadingData
                    ? "Loading Clients..."
                    : "Select Client"
                }
                onChange={(value: string) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    userId: value,
                  }))
                }
              />
            </div>
          </div>
        </ComponentCard>

        {/* ================= PACKAGE & BENEFICIARY DETAILS ================= */}

        <ComponentCard title="Package & Beneficiary Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">
                  Package Type
                </label>

                <Select
                  options={packages.map((pkg) => ({
                    value: pkg.packageId,
                    label: pkg.name,
                  }))}
                  placeholder={
                    isLoadingData
                      ? "Loading Packages..."
                      : "Select Package Type"
                  }
                  onChange={(value: string) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      packageId: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Start Date
                </label>

                <DatePicker
                  id="policy-start-date"
                  placeholder="Select Start Date"
                  onChange={(selectedDates) => {
                    const selectedDate =
                      selectedDates[0];

                    setForm((previousForm) => ({
                      ...previousForm,
                      startDate: selectedDate
                        ? selectedDate.toISOString()
                        : "",
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-600">
                Beneficiaries
              </label>

              {form.beneficiaries.map(
                (beneficiary, index) => (
                  <div
                    key={index}
                    className="space-y-3"
                  >
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <DefaultInputs
                          label=""
                          name={`beneficiary-name-${index}`}
                          value={beneficiary.fullName}
                          onChange={(event) =>
                            handleBeneficiaryChange(
                              index,
                              "fullName",
                              event.target.value
                            )
                          }
                          placeholder="Enter beneficiary name"
                        />
                      </div>

                      {index ===
                        form.beneficiaries.length -
                          1 && (
                        <button
                          type="button"
                          onClick={addBeneficiary}
                          className="h-10 w-10 rounded-lg bg-teal-600 text-white text-xl font-semibold hover:bg-teal-700"
                        >
                          +
                        </button>
                      )}

                      {form.beneficiaries.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeBeneficiary(index)
                          }
                          className="h-10 w-10 rounded-lg bg-red-600 text-white text-xl font-semibold hover:bg-red-700"
                        >
                          −
                        </button>
                      )}
                    </div>

                    <DefaultInputs
                      label=""
                      name={`beneficiary-id-number-${index}`}
                      value={beneficiary.idNumber}
                      onChange={(event) =>
                        handleBeneficiaryChange(
                          index,
                          "idNumber",
                          event.target.value
                        )
                      }
                      placeholder="Enter beneficiary ID number"
                    />

                    <Select
                      options={relationshipOptions}
                      placeholder="Select Relationship"
                      onChange={(value: string) =>
                        handleBeneficiaryChange(
                          index,
                          "relationship",
                          value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </ComponentCard>

        {/* ================= SUBMIT ================= */}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              isSubmitting || isLoadingData
            }
          >
            {isSubmitting
              ? "Creating..."
              : "Create Policy"}
          </Button>
        </div>
      </form>
    </div>
  );
}