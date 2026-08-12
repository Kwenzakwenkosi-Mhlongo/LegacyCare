"use client";

import React from "react";
import Label from "../Label";
import Select from "../Select";
import MultiSelect from "../MultiSelect";
import { ChevronDownIcon } from "@/icons";

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  name: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>

      <div className="relative">
        <Select
          options={options}
          placeholder={`Select ${label}`}
          onChange={onChange}
          className="dark:bg-dark-900"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <ChevronDownIcon />
        </span>
      </div>
    </div>
  );
}