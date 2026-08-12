"use client";

import { useEffect, useState } from "react";

import { getPackages } from "@/lib/packageService";

import type { PolicyResponse } from "@/types/policy";

interface PackageApiResponse {
  packageId: string | number;
  packageName?: string;
  name?: string;
  packageType?: string;
  packagePrice: number;
  maxBeneficiaries: number;
}

interface PackageResponse {
  packageId: string;
  packageName: string;
  packagePrice: number;
  maxBeneficiaries: number;
}

interface ChangePolicyProps {
  policy: PolicyResponse;

  onCancel: () => void;

  onSave: (data: {
    policyId: string;
    newPackageId: string;
  }) => void | Promise<void>;
}

export default function ChangePolicy({
  policy,
  onCancel,
  onSave,
}: ChangePolicyProps) {
  const [packages, setPackages] =
    useState<PackageResponse[]>([]);

  const [selectedPackageId, setSelectedPackageId] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data: PackageApiResponse[] =
          await getPackages();

        const normalizedPackages: PackageResponse[] =
          data.map((packageItem) => ({
            packageId: String(
              packageItem.packageId
            ),

            packageName:
              packageItem.packageName ??
              packageItem.name ??
              packageItem.packageType ??
              "Unnamed package",

            packagePrice:
              packageItem.packagePrice,

            maxBeneficiaries:
              packageItem.maxBeneficiaries,
          }));

        setPackages(normalizedPackages);
      } catch (error) {
        console.error(
          "Failed to load packages:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load packages."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPackages();
  }, []);

  const handleSave = async () => {
    if (!selectedPackageId) {
      setError(
        "Please select a package."
      );

      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSave({
        policyId: policy.policyId,
        newPackageId:
          selectedPackageId,
      });
    } catch (error) {
      console.error(
        "Failed to change policy:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to change policy."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const currentPackageName =
    policy.packageName?.trim().toLowerCase() ??
    "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Change Policy
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Current package:{" "}
          {policy.packageName ??
            "Not available"}
        </p>
      </div>

      <div>
        <label
          htmlFor="newPackage"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          New package
        </label>

        <select
          id="newPackage"
          value={selectedPackageId}
          onChange={(event) => {
            setSelectedPackageId(
              event.target.value
            );

            setError(null);
          }}
          disabled={
            isLoading || isSaving
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
        >
          <option value="">
            {isLoading
              ? "Loading packages..."
              : "Select a package"}
          </option>

          {packages.map(
            (packageItem) => {
              const packageName =
                packageItem.packageName
                  .trim()
                  .toLowerCase();

              const isCurrentPackage =
                packageName ===
                currentPackageName;

              return (
                <option
                  key={
                    packageItem.packageId
                  }
                  value={
                    packageItem.packageId
                  }
                  disabled={
                    isCurrentPackage
                  }
                >
                  {
                    packageItem.packageName
                  }
                  {isCurrentPackage
                    ? " (Current)"
                    : ""}
                </option>
              );
            }
          )}
        </select>

        {!isLoading &&
          packages.length === 0 &&
          !error && (
            <p className="mt-2 text-sm text-gray-500">
              No packages are
              available.
            </p>
          )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        The current policy will be
        discontinued. A new active policy
        will be created for the same client,
        and the beneficiaries will be copied
        to the new policy.
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            !selectedPackageId ||
            isLoading ||
            isSaving
          }
          className="flex-1 rounded-md bg-teal-700 px-3 py-2.5 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Changing..."
            : "Save"}
        </button>
      </div>
    </div>
  );
}