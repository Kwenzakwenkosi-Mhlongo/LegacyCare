"use client";

import {
  useEffect,
  useState,
} from "react";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import SelectUnit from "./SelectUnit";
import DeceasedForm from "./DeceasedForm";

import type {
  StorageResponse,
} from "@/types/mortuary";

export default function CreateDeceasedPage() {
  useEffect(() => {
    document.title =
      "Capture Deceased Details";
  }, []);

  const [
    selectedUnit,
    setSelectedUnit,
  ] = useState<StorageResponse | null>(
    null
  );

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Capture Deceased Details"
      />

      {!selectedUnit ? (
        <SelectUnit
          onSelect={setSelectedUnit}
        />
      ) : (
        <DeceasedForm
          selectedUnit={selectedUnit}
          onBack={() =>
            setSelectedUnit(null)
          }
        />
      )}
    </div>
  );
}