"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";

type Column = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
};

type ReusableTableProps = {
  columns: Column[];
  data: Record<string, any>[];
  onRowClick?: (row: any) => void;
  onEdit?: (row:any)=>void;
  onDelete?: (row:any)=>void;
  rowsPerPage?: number;
};

export default function ReusableTable({
  columns,
  data = [],
  onRowClick,
  onEdit,
  onDelete,
  rowsPerPage
}: ReusableTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          {/* HEADER */}
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  isHeader
                  className="px-6 py-4 align-middle text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* BODY */}
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-200 cursor-pointer hover:bg-[#fbfefeff] ${row.selected ? "bg-[#ebf7f8ff]" : ""}`}
              >
                {/*border-b border-gray-200 cursor-pointer hover:bg-[#fbfefeff]*/}
                {columns.map((column) => (
                  <TableCell 
                  key={column.key}
                  className="px-6 py-4 align-middle text-left"
                  >
                    {/* OPTIONS COLUMN */}
                    {column.render ? (
                      column.render(row)
                    ) : 
                    column.key === "options" ? (
                      <div className="flex items-center gap-4">

                        {/* VIEW */}
                        <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.(row);
                        }}            
                        className="text-gray-500 hover:text-cyan-600 transition-colors">
                          <EyeIcon />
                        </button>

                        {/* EDIT */}
                        <button
                        onClick={(e) => {e.stopPropagation();
                          onEdit?.(row);
                        }}
                        className="text-gray-500 hover:text-cyan-600 transition-colors">
                          <PencilIcon />
                        </button>

                        {/* DELETE */}
                        <button 
                        onClick={(e)=>{e.stopPropagation();
                          onDelete?.(row);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors">
                          <TrashBinIcon />
                        </button>
                      </div>
                    ) : (
                      row[column.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}