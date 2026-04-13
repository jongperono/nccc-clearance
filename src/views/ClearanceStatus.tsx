import React, { useState } from "react";
import { Link } from "react-router-dom";
import DynamicTable, { ColumnDefinition } from "../utils/DynamicTable";
import ncccLogo from "../assets/nccc_logo.webp";
import { FaPrint } from "react-icons/fa";

interface Clearance {
  id: string;
  department: string;
  manager: string;
  status: string;
  remarks: string;
  userId: string;
  userName: string;
  branch: string;
  userDepartment: string;
}

const ClearanceStatus: React.FC = () => {
  const [clearances, setClearances] = useState<Clearance[]>([
    {
      id: "1",
      department: "ISD Dept.",
      manager: "John Doe",
      status: "Pending",
      remarks: "...",
      userId: "1001",
      userName: "Maria Leonora Tersita Mejora Quiros",
      branch: "Panacan",
      userDepartment: "Manager for Treasury Disbursement",
    },
    {
      id: "2",
      department: "Finance Dept.",
      manager: "Jane Smith",
      status: "Approved",
      remarks: "OK",
      userId: "1001",
      userName: "Maria Leonora Tersita Mejora Quiros",
      branch: "Panacan",
      userDepartment: "Manager for Treasury Disbursement",
    },
  {
    id: "4",
    department: "HR Dept.",
    manager: "Emily White",
    status: "Approved",
    remarks: "OK",
    userId: "1001",
    userName: "Maria Leonora Tersita Mejora Quiros",
    branch: "Panacan",
    userDepartment: "Manager for Treasury Disbursement",
  },
  {
    id: "5",
    department: "Operations Dept.",
    manager: "David Johnson",
    status: "Pending",
    remarks: "...",
    userId: "1001",
    userName: "Maria Leonora Tersita Mejora Quiros",
    branch: "Panacan",
    userDepartment: "Manager for Treasury Disbursement",
  },
  ]);

  const columns: ColumnDefinition<Clearance>[] = [
    { dataField: "id", text: "ID", sortable: true },
    { dataField: "department", text: "Department", sortable: true },
    { dataField: "manager", text: "Department Manager", sortable: true },
    {
      dataField: "status",
      text: "Clearance Status",
      sortable: true,
      formatter: (cell: string) => (
        <span className={cell === "Approved" ? "text-success fw-bold" : "text-warning fw-bold"}>
          {cell}
        </span>
      ),
    },
    {
      dataField: "remarks",
      text: "Remarks",
      formatter: (cell: string, row: Clearance) =>
        cell === "OK" ? (
          <span className="text-success fw-bold">OK</span>
        ) : (
          <Link to={`/clearance/${row.id}`} className="btn btn-primary btn-sm d-print-none">
            ...
          </Link>
        ),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mt-4">
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-3">
  <div className="d-flex align-items-center">
    <h2 className="ms-3 d-print-none">Employee Dashboard</h2>
  </div>
  <button className="btn btn-danger d-print-none">Logout</button>
</div>

      {/* LOGO - Aligns Left in Print Mode */}
      <div className="d-flex justify-content-start mb-3">
        <img src={ncccLogo} alt="NCCC Logo" className="img-fluid" width="150" />
      </div>

      {/* EMPLOYEE DETAILS */}
      <div className="mb-4 p-3 border rounded shadow-sm bg-light">
        <div className="row">
          <div className="col-md-6">
            <h5><strong>ID no:</strong> {clearances[0].userId}</h5>
            <h5><strong>Branch:</strong> {clearances[0].branch}</h5>
          </div>
          <div className="col-md-6">
            <h5><strong>Name:</strong> {clearances[0].userName}</h5>
            <h5><strong>Department:</strong> {clearances[0].userDepartment}</h5>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DynamicTable<Clearance>
        data={clearances}
        columns={columns}
        keyField="id"
        title="Clearance Status"
        striped
        hover
        responsive
        showSearch={false}
        showPagination={false}
      />

      {/* PRINT BUTTON (Hidden in Print Mode) */}
      <div className="d-flex justify-content-end mt-3 d-print-none">
        <button className="btn btn-primary" onClick={handlePrint}>
          <FaPrint className="me-2" /> Print
        </button>
      </div>
    </div>
  );
};

export default ClearanceStatus;
