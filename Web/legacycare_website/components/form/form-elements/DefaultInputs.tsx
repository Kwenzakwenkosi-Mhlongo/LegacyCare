"use client";

import React from "react";
import Label from "../Label";
import Input from "../input/InputField";

type InputFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
};

export default function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: InputFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>

      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}