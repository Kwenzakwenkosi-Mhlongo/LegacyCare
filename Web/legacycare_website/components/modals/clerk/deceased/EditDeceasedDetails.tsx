"use client";

import {
  useEffect,
  useState,
} from "react";

import EditableRow from "@/components/reusables/EditableRow";

import {
  UserIcon,
  InfoIcon,
  PencilIcon,
  CloseLineIcon,
} from "@/icons";

import type {
  DeceasedResponse,
  UpdateDeceasedRequest,
} from "@/types/deceased";

interface EditDeceasedDetailsProps {
  deceased: DeceasedResponse;

  onSave: (
    deceasedId: string,
    data: UpdateDeceasedRequest
  ) => Promise<void>;

  onCancel: () => void;
}

export default function EditDeceasedDetails({
  deceased,
  onSave,
  onCancel,
}: EditDeceasedDetailsProps) {
  const [form, setForm] = useState({
    fullName: deceased.fullName,
    gender: deceased.gender,
    causeOfDeath:
      deceased.causeOfDeath ?? "",
  });

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setForm({
      fullName: deceased.fullName,
      gender: deceased.gender,
      causeOfDeath:
        deceased.causeOfDeath ?? "",
    });

    setError(null);
  }, [deceased]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!form.fullName.trim()) {
      setError(
        "The deceased name is required."
      );

      return;
    }

    if (!form.gender) {
      setError(
        "Please select a gender."
      );

      return;
    }

    const request:
      UpdateDeceasedRequest = {
      fullName: form.fullName.trim(),
      gender: form.gender,
      causeOfDeath:
        form.causeOfDeath.trim() ||
        null,
    };

    try {
      setIsSaving(true);
      setError(null);

      await onSave(
        deceased.deceasedId,
        request
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the deceased record."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* HEADER */}

      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              Edit Deceased Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Deceased ID:{" "}
              {deceased.deceasedId}
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                deceased.isReleased
                  ? "bg-gray-100 text-gray-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {deceased.isReleased
                ? "Released"
                : "In Mortuary"}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Editable Information
          </h3>

          <EditableRow
            icon={<UserIcon />}
            label="Full Name"
          >
            <input
              type="text"
              value={form.fullName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  fullName:
                    event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </EditableRow>

          <EditableRow
            icon={<UserIcon />}
            label="Gender"
          >
            <select
              value={form.gender}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  gender:
                    event.target.value,
                }))
              }
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
          </EditableRow>

          <EditableRow
            icon={<InfoIcon />}
            label="Cause of Death"
          >
            <textarea
              value={form.causeOfDeath}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  causeOfDeath:
                    event.target.value,
                }))
              }
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </EditableRow>
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex gap-3 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CloseLineIcon />

          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilIcon />

          {isSaving
            ? "Updating..."
            : "Update"}
        </button>
      </div>
    </div>
  );
}