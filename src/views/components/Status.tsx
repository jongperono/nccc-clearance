import React, { useState } from "react";
import { Table, Button, Form } from "react-bootstrap";

// Status table for clearance tracking
const Status: React.FC = () => {
    const statusData = [
        { id: 114, name: "Kathiss Evergreen", email: "katkat@gmail.com", department: "Finance", type: "Resignation", date: "01/04/2025", status: "In progress" },
        { id: 316, name: "Yanna Quinn", email: "quinnyanna@gmail.com", department: "IT", type: "Resignation", date: "01/16/2025", status: "Cleared" },
        { id: 121, name: "Chen Beixuan", email: "beixuan@gmail.com", department: "IT", type: "Resignation", date: "01/20/2025", status: "Pending" },
        { id: 422, name: "Alice Morgan", email: "alice.morgan@gmail.com", department: "HR", type: "Transfer", date: "02/10/2025", status: "In progress" },
        { id: 511, name: "Jonas Grey", email: "jonas.grey@gmail.com", department: "Finance", type: "Promotion", date: "03/02/2025", status: "Cleared" },
        { id: 632, name: "Ella Smith", email: "ella.smith@gmail.com", department: "IT", type: "Termination", date: "03/15/2025", status: "Pending" },
    ];

    // State for search, filter, and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;

    // Filter logic
    const filteredData = statusData
        .filter((entry) =>
            (entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.department.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterStatus === "All" || entry.status === filterStatus)
        );

    // Pagination logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);

    // Get status color class
    const getStatusClass = (status: string) => {
        switch (status) {
            case "In progress":
                return "text-warning";
            case "Cleared":
                return "text-success";
            case "Pending":
                return "text-primary";
            default:
                return "";
        }
    };

    return (
        <div className="container mt-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Status</h2>
            </div>

            {/* Search & Filter Section */}
            <div className="d-flex gap-2 mb-3">
                <Form.Control
                    type="text"
                    placeholder="Search by Name, Email, or Department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All</option>
                    <option value="In progress">In Progress</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Pending">Pending</option>
                </Form.Select>
            </div>

            {/* Table Data */}
            <Table striped hover responsive>
                <thead className="table-primary">
                    <tr>
                        <th>ID no.</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Clearance Type</th>
                        <th>Date of Application</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {currentRecords.map((entry) => (
                        <tr key={entry.id}>
                            <td>{entry.id}</td>
                            <td>{entry.name}</td>
                            <td>{entry.email}</td>
                            <td>{entry.department}</td>
                            <td>{entry.type}</td>
                            <td>{entry.date}</td>
                            <td className={getStatusClass(entry.status)}>{entry.status}</td>
                        </tr>
                    ))}

                    {/* No Data Found Message */}
                    {currentRecords.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center text-danger">
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* Pagination Controls */}
            <div className="d-flex justify-content-center align-items-center gap-3">
                <Button
                    variant="primary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </Button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="primary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Status;
