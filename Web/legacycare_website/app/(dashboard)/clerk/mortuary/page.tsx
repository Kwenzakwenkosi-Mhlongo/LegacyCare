"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import UnitDetails from "@/components/modals/clerk/mortuary/UnitDetails";
import MortuaryMetricCard from "@/components/dashboard/metriccard/clerk/MortuaryMetricCard";
import { getMortuaryUnits } from "@/lib/services/mortuaryService";
import type { MortuaryUnitView } from "@/types/mortuary";

type AvailabilityFilter =
  | "all"
  | "available"
  | "occupied";

export default function MortuaryPage() {
  /* ---------------- PAGE TITLE ---------------- */

  useEffect(() => {
    document.title = "Manage Units";
  }, []);

  /* ---------------- STATES ---------------- */

  const [units, setUnits] = useState<
    MortuaryUnitView[]
  >([]);

  const [
    selectedUnit,
    setSelectedUnit,
  ] = useState<MortuaryUnitView | null>(
    null
  );

  const [
    selectedUnitId,
    setSelectedUnitId,
  ] = useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] =
    useState<AvailabilityFilter>("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage] = useState(5);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ---------------- TABLE HEADINGS ---------------- */

  const columns = [
    {
      key: "storageId",
      label: "Storage ID",
    },
    {
      key: "unitNumber",
      label: "Unit Number",
    },
    {
      key: "branchId",
      label: "Branch",
    },
    {
      key: "availability",
      label: "Availability",
    },
    {
      key: "deceasedName",
      label: "Occupied By",
    },
  ];

  /* ---------------- LOAD UNITS ---------------- */

  const loadUnits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data =
        await getMortuaryUnits();

      setUnits(data);

      /*
       * Refresh the currently selected unit
       * after the data is reloaded.
       */
      if (selectedUnitId) {
        const refreshedUnit =
          data.find(
            (unit) =>
              unit.storageId ===
              selectedUnitId
          ) ?? null;

        setSelectedUnit(
          refreshedUnit
        );

        if (!refreshedUnit) {
          setSelectedUnitId("");
        }
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load mortuary units.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  /* ---------------- METRIC FUNCTIONS ---------------- */

  const getTotalStorageUnits = (
    storageUnits: MortuaryUnitView[]
  ): number => {
    return storageUnits.length;
  };

  const getTotalAvailableUnits = (
    storageUnits: MortuaryUnitView[]
  ): number => {
    return storageUnits.filter(
      (unit) => unit.isAvailable
    ).length;
  };

  const getTotalOccupiedUnits = (
    storageUnits: MortuaryUnitView[]
  ): number => {
    return storageUnits.filter(
      (unit) => !unit.isAvailable
    ).length;
  };

  const totalStorage =
    getTotalStorageUnits(units);

  const totalAvailable =
    getTotalAvailableUnits(units);

  const totalOccupied =
    getTotalOccupiedUnits(units);

  /* ---------------- FILTERING ---------------- */

  const filteredUnits = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        normalizedSearch === "" ||
        unit.storageId
          .toLowerCase()
          .includes(normalizedSearch) ||
        unit.unitNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        unit.branchId
          .toLowerCase()
          .includes(normalizedSearch) ||
        (
          unit.deceasedName ?? ""
        )
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (
          availabilityFilter ===
            "available" &&
          unit.isAvailable
        ) ||
        (
          availabilityFilter ===
            "occupied" &&
          !unit.isAvailable
        );

      return (
        matchesSearch &&
        matchesAvailability
      );
    });
  }, [
    units,
    searchTerm,
    availabilityFilter,
  ]);

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUnits.length /
        itemsPerPage
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /*
   * Return to the first page whenever
   * the search or filter changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    availabilityFilter,
  ]);

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const paginatedUnits =
    filteredUnits.slice(
      startIndex,
      endIndex
    );

  /* ---------------- TABLE DATA ---------------- */

  /*
   * ReusableTable displays flat values,
   * so the boolean is converted into
   * a readable label here.
   */
  const tableData = paginatedUnits.map(
    (unit) => ({
      ...unit,

      availability:
        unit.isAvailable
          ? "Available"
          : "Occupied",

      deceasedName:
        unit.deceasedName ??
        "Not Occupied",
    })
  );

  /* ---------------- FUNCTIONS ---------------- */

  const handleViewUnit = (
    tableUnit: MortuaryUnitView
  ) => {
    /*
     * The table data contains additional
     * formatted fields. Find the original
     * typed unit using its storage ID.
     */
    const originalUnit =
      units.find(
        (unit) =>
          unit.storageId ===
          tableUnit.storageId
      ) ?? null;

    setSelectedUnit(originalUnit);

    setSelectedUnitId(
      originalUnit?.storageId ?? ""
    );
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  };

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  };

  const handlePageChange = (
    page: number
  ) => {
    setCurrentPage(page);
  };

  /* ---------------- PAGE ---------------- */

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <PageBreadcrumb pageTitle="Manage Units" />

      {/* METRIC CARDS */}

      <MortuaryMetricCard
        totStorage={totalStorage}
        totAvailable={totalAvailable}
        totUnavailable={totalOccupied}
      />

      {/* SEARCH AND FILTER */}

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* SEARCH */}

        <div className="w-full sm:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search unit, branch or deceased..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {/* AVAILABILITY FILTER */}

        <div className="w-full sm:w-52">
          <select
            value={availabilityFilter}
            onChange={(event) =>
              setAvailabilityFilter(
                event.target
                  .value as AvailabilityFilter
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          >
            <option value="all">
              All Units
            </option>

            <option value="available">
              Available
            </option>

            <option value="occupied">
              Occupied
            </option>
          </select>
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadUnits}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm text-white transition hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      )}

      {/* TABLE AND DETAILS PANEL */}

      <div className="grid grid-cols-12 gap-6">
        {/* TABLE */}

        <div className="col-span-12 xl:col-span-8">
          <ComponentCard title="Units">
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Loading storage units...
                </p>
              </div>
            ) : tableData.length > 0 ? (
              <>
                <ReusableTable
                  columns={columns}
                  data={tableData}
                  onRowClick={
                    handleViewUnit
                  }
                />

                {/* PAGINATION */}

                <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* RESULT INFORMATION */}

                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    {filteredUnits.length ===
                    0
                      ? 0
                      : startIndex + 1}
                    {" - "}
                    {Math.min(
                      endIndex,
                      filteredUnits.length
                    )}{" "}
                    of{" "}
                    {
                      filteredUnits.length
                    }{" "}
                    units
                  </p>

                  {/* PAGE BUTTONS */}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={
                        handlePreviousPage
                      }
                      disabled={
                        currentPage === 1
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (_, index) =>
                        index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            page
                          )
                        }
                        className={`h-9 w-9 rounded-md text-sm font-medium transition ${
                          currentPage ===
                          page
                            ? "bg-teal-700 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={
                        handleNextPage
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  No storage units match
                  your search or filter.
                </p>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* DETAILS PANEL */}

        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="Unit Details">
            {selectedUnit ? (
              <UnitDetails
                unit={selectedUnit}
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a unit to view
                  details.
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}