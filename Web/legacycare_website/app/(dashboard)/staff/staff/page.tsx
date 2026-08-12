"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import StaffMetricCard from "@/components/dashboard/metriccard/admin/StaffMetricCard";
import StaffDetails from "@/components/modals/admin/staff/StaffDetails";
import EditStaffDetails from "@/components/modals/admin/staff/EditStaffDetails";
import DeleteConfirmation from "@/components/modals/confirmation/DeleteConfirmation";
import { getStaffs, updateStaff, deactivateStaff, activateStaff } from "@/lib/staffService";
import Pagination from "@/components/tables/Pagination";

export default function StaffPage() {
  React.useEffect(() => {
    document.title = "Manage Staff";
  }, []);

  React.useEffect(() => {
    loadStaff();
  }, []);
  /* ---------------- STATES ---------------- */

  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = React.useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [editStaff, setEditStaff] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* ---------------- TABLE HEADINGS ---------------- */

  const columns = [
    {
      key: "staff", label: "Staff",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-cyan-700">
            {row.initials}
          </div>

          <div>
            <div className="font-medium text-gray-900">
              {row.fullName}
            </div>

            <div className="text-sm text-gray-500">
              {row.displayStaffId}
            </div>
          </div>
        </div>
      ),
    },

    { key: "role", label: "Role" },
    { key: "status", label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${row.status === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "options", label: "Options" },
  ];

  /* ---------------- FUNCTIONS ---------------- */

  const loadStaff = async () => {
    try {
      const data = await getStaffs();

      const mappedStaff = data.map((staff: any) => ({
        staffId: staff.staffId,
        displayStaffId: staff.displayStaffId,
        fullName: staff.user?.fullName,
        idNumber: staff.user?.idNumber,
        cellNo: staff.user?.cellNo,
        email: staff.user?.email,
        address: staff.user?.address,
        salary: staff.salary,
        branchId: staff.branchId,
        branch: staff.branch?.branchName,
        role: staff.staffRole,
        initials: staff.user?.fullName
          ?.split(" ").map((n: string) => n[0])
          .join(""),
        status: staff.user?.isActive ? "Active" : "Inactive",
        joinedDate: staff.hireDate
          ? staff.hireDate.split("T")[0]
          : "",
      })
      )
        .sort((a: any, b: any) => Number(a.staffId) - Number(b.staffId));

      setStaffs(mappedStaff);
      return mappedStaff;
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch =
      [
        staff.displayStaffId,
        staff.fullName,
        staff.idNumber,
        staff.cellNo,
        staff.email,
        staff.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" ||
      staff.status === statusFilter;

    return matchesSearch && matchesStatus;
  }
  );



  const handleViewStaff = (staff: any) => {
    setSelectedStaff(staff);
    setSelectedStaffId(staff.staffId);
    setEditStaff(false);
  };

  const handleEditStaff = () => {
    setEditStaff(true)
  };

  const handleSaveStaff = async (updatedStaff: any) => {
      try {
        await updateStaff(updatedStaff.staffId, {
          fullName: updatedStaff.fullName,
          idNumber: updatedStaff.idNumber,
          email: updatedStaff.email,
          cellNo: updatedStaff.cellphone,
          address: updatedStaff.address,
          role: updatedStaff.role,
          salary: updatedStaff.salary,
          branchId: updatedStaff.branchId,
          isActive: updatedStaff.status === "Active",
        });
  
        const refreshedStaffs = await loadStaff();
        const refreshedStaff = refreshedStaffs
          .find((c: any) => c.staffId === updatedStaff.staffId);
  
        if (refreshedStaff) {
          setSelectedStaff(refreshedStaff);
        }
        setEditStaff(false);
      }
      catch (error: any) {
        const message =
        error?.message ??
        "Unable to update staff";
        console.error(error);
      }
    }

    const handleDeactivateStaff = async () => {
        if (!selectedStaff) return;
    
        try {
          await deactivateStaff(selectedStaff.staffId);
    
          const refreshedStaffs = await loadStaff();
    
          const refreshedStaff = refreshedStaffs.find(
            (s: any) => s.staffId === selectedStaff.staffId
          );
          if (refreshedStaff) {
            setSelectedStaff(refreshedStaff);
          }
          setDeleteModal(false);
        } catch (error) {
          console.error(error);
        }
      };

  const handleActivateStaff = async () => {
      if (!selectedStaff) return;
  
      try {
        await activateStaff(selectedStaff.staffId);
  
        const refreshedStaffs = await loadStaff();
  
        const refreshedStaff = refreshedStaffs.find(
          (c: any) => c.staffId === selectedStaff.staffId
        );
  
        if (refreshedStaff) {
          setSelectedStaff(refreshedStaff);
        }
      } catch (error) {
        console.error(error);
      }
    }
  
    const totalPages = Math.ceil(filteredStaffs.length / rowsPerPage);
    const currentStaffs = filteredStaffs.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );



  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageBreadcrumb pageTitle="Manage Staff" />
      {/* METRIC CARDS */}
      <StaffMetricCard
        totStaff={staffs.length}
        activeStaff={staffs.filter((s) => s.status === "Active").length}
        inactiveStaff={staffs.filter((s) => s.status === "Inactive").length}
      />
      {/* TABLE + DETAILS PANEL */}
      <div className="grid grid-cols-12 gap-6">
        {/* TABLE */}
        <div className="col-span-8">
          <ComponentCard title="Staff">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex gap-3">
                <input
                type="text"
                placeholder="Search Staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />

              <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="All">All Staff</option>
                <option value="Active">Active Staff</option>
                <option value="Inactive">Inactive Staff</option>
              </select>
              </div>

              <Link
                href="/admin/staff/create"
                className="text-sm text-teal-600">
                + Add New Staff
              </Link>
            </div>
            <p className="mb-2 text-sm text-gray-500"> Showing {filteredStaffs.length} of {staffs.length} staff</p>

            <ReusableTable
              columns={columns}
              data={currentStaffs}
              onRowClick={handleViewStaff}
              onEdit={(staffs) => {
                setSelectedStaff(staffs);
                setEditStaff(true);
              }}
              onDelete={(staffs) => {
                setSelectedStaff(staffs);
                setDeleteModal(true);
              }}
            />
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            />
          </ComponentCard>
        </div>

        {/* DETAILS PANEL */}
        <div className="col-span-4">
          <ComponentCard title={editStaff ? "Edit Staff" : "Staff Details"}>
            {selectedStaff ? (
              editStaff ? (

                <EditStaffDetails
                  staff={selectedStaff}
                  onCancel={() => setEditStaff(false)}
                  onSave={handleSaveStaff}
                />
              ) : (

                <StaffDetails
                  staff={selectedStaff}
                  onEdit={handleEditStaff}
                  onDeactivate={handleDeactivateStaff}
                  onActivate={handleActivateStaff}
                />
              )
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a staff member to view details
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      <DeleteConfirmation
        isOpen={deleteModal}
        itemName={selectedStaff?.fullName}
        onCancel={() => {
          setDeleteModal(false);
        }}
        onConfirm={handleDeactivateStaff}
      />
    </div>
  );
}