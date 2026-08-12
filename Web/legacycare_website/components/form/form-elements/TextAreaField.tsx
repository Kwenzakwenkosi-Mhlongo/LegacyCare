"use client";

import React from "react";
import Label from "../Label";
import TextArea from "../input/TextArea";

type TextAreaFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

export default function TextAreaField({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>

      <TextArea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}