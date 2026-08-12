"use client";

import { useEffect, useMemo, useState, } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ReusableTable from "@/components/tables/ReusableTable";
import { getAvailableStorageUnits } from "@/lib/services/mortuaryService";
import type { StorageResponse } from "@/types/mortuary";

interface SelectUnitProps {
  onSelect: (unit: StorageResponse) => void;
}

const ITEMS_PER_PAGE = 5;

export default function SelectUnit({
  onSelect,
}: SelectUnitProps) {
  const [units, setUnits] = useState<
    StorageResponse[]
  >([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

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
      label: "Branch ID",
    },
    {
      key: "availability",
      label: "Availability",
    },
  ];

  const loadAvailableUnits =
    async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data =
          await getAvailableStorageUnits();

        setUnits(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load available units."
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadAvailableUnits();
  }, []);

  const filteredUnits = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return units.filter((unit) => {
      return (
        search === "" ||
        unit.storageId
          .toLowerCase()
          .includes(search) ||
        unit.unitNumber
          .toLowerCase()
          .includes(search) ||
        unit.branchId
          .toLowerCase()
          .includes(search)
      );
    });
  }, [units, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUnits.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedUnits =
    filteredUnits.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const tableData =
    paginatedUnits.map((unit) => ({
      ...unit,
      availability: "Available",
    }));

  const handleSelect = (
    tableUnit: StorageResponse
  ) => {
    const selected =
      units.find(
        (unit) =>
          unit.storageId ===
          tableUnit.storageId
      );

    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <ComponentCard title="Select a Storage Unit">
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search by unit, storage ID or branch..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadAvailableUnits}
            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Loading available units...
        </div>
      ) : tableData.length > 0 ? (
        <>
          <ReusableTable
            columns={columns}
            data={tableData}
            onRowClick={handleSelect}
          />

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              {startIndex + 1}-
              {Math.min(
                startIndex +
                  ITEMS_PER_PAGE,
                filteredUnits.length
              )}{" "}
              of {filteredUnits.length}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) => page - 1
                  )
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {currentPage} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) => page + 1
                  )
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold text-yellow-700">
            No Available Storage Units
          </h3>

          <p className="text-sm text-gray-600">
            There are currently no available
            storage units.
          </p>
        </div>
      )}
    </ComponentCard>
  );
}