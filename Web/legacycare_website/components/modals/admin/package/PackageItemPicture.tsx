
"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";
import {
  uploadPackageItemPicture,
  deletePackageItemPicture,
} from "@/lib/packageCatalogService";

interface PackageItemPictureProps {
  packageItemId?: string;
  imageBlobName?: string | null;
  onImageChange?: (imageBlobName: string | null) => void;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function PackageItemPicture({
  packageItemId,
  imageBlobName,
  onImageChange,
}: PackageItemPictureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const loadPicture = async () => {
      if (!packageItemId || !imageBlobName) {
        setImageUrl(null);
        return;
      }

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/package-catalog/items/${packageItemId}/picture`,
          {
            method: "GET",
            headers: {
              Accept: "image/*",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 404) {
          setImageUrl(null);
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load package item picture (${response.status}).`
          );
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          throw new Error("Invalid package item picture response.");
        }

        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImageUrl(objectUrl);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setImageUrl(null);
          setError(
            err.message || "Unable to load package item picture."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPicture();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [packageItemId, imageBlobName]);

  const handleChooseFile = () => {
    setError("");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !packageItemId) {
      return;
    }

    setError("");

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError(
        "Only JPEG, PNG and WebP images are allowed."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "Package item pictures must be 2 MB or smaller."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      setUploading(true);

      const result =
        await uploadPackageItemPicture(
          packageItemId,
          file
        );

      onImageChange?.(
        result.imageBlobName ?? null
      );

      setError("");
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Unable to upload package item picture."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!packageItemId || !imageBlobName) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      await deletePackageItemPicture(
        packageItemId
      );

      setImageUrl(null);

      onImageChange?.(null);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Unable to remove package item picture."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-800">
          Package Item Picture
        </h4>

        <p className="mt-1 text-xs text-gray-500">
          Upload a JPEG, PNG or WebP image. Maximum size is
          2 MB.
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {loading ? (
            <span className="text-sm text-gray-400">
              Loading...
            </span>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Package item"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="px-4 text-center">
              <div className="text-3xl text-gray-300">
                🖼️
              </div>

              <p className="mt-2 text-xs text-gray-400">
                No picture
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleChooseFile}
            disabled={!packageItemId || uploading}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : imageUrl
              ? "Replace Picture"
              : "Upload Picture"}
          </button>

          {imageUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Picture
            </button>
          )}

          {!packageItemId && (
            <p className="max-w-xs text-xs text-gray-400">
              Save the package item first before uploading a
              picture.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
