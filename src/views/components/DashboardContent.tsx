import { useState, useEffect } from "react";
import { Button, Row, Col, Spinner } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert"; // for alerts
import ClearanceDetails from "./ClearanceDetails";

// Clearance item interface for table

interface ClearanceItem {
    id: number;
    name: string;
    company: string;
    department: string;
    branch: string;
    purpose: string;
    date: string;
    status: string;
    assigner?: string | null;
    is_approved_by_me?: boolean;
}

const Dashboard = () => {
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [clearances, setClearances] = useState<ClearanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedClearanceId, setSelectedClearanceId] = useState<number | null>(null);
    const { showAlert, AlertComponent } = useCustomAlert();

    // Fetch clearances (merge clearances and other_clearances)
    useEffect(() => {
        const fetchClearances = async () => {
            setLoading(true);
            try {
                const response = await apiRequest("/my-clearances", "GET");
                const responseData = response?.data;

                // Merge clearances and other_clearances if both exist
                let dataArr: any[] = [];
                if (responseData?.data?.clearances && responseData?.data?.other_clearances) {
                    dataArr = [
                        ...responseData.data.clearances,
                        ...responseData.data.other_clearances
                    ];
                } else if (responseData?.data?.clearances) {
                    dataArr = responseData.data.clearances;
                } else if (Array.isArray(responseData?.data)) {
                    dataArr = responseData.data;
                }

                const mapped = dataArr.map((item: any) => {
                    const clearance = item.Clearance || item || {};
                    return {
                        id: clearance.id ?? item.clearance_id ?? item.id ?? 0,
                        name: [
                            clearance.first_name ?? "",
                            clearance.middle_name ?? "",
                            clearance.last_name ?? ""
                        ].filter(Boolean).join(" ") || "N/A",
                        company: clearance.Company?.name ?? clearance.company_id ?? "N/A",
                        department: clearance.Department?.name ?? clearance.department_id ?? "N/A",
                        branch: clearance.Branch?.name ?? clearance.branch_id ?? "N/A",
                        purpose: clearance.purpose ?? clearance.type ?? "N/A",
                        date: clearance.createdAt
                            ? new Date(clearance.createdAt).toLocaleDateString()
                            : clearance.created_at
                                ? new Date(clearance.created_at).toLocaleDateString()
                                : "N/A",
                        status: item.status ?? clearance.clearance_status ?? "Pending",
                        assigner: clearance.assigner
                            ? [
                                clearance.assigner.first_name,
                                clearance.assigner.last_name
                            ].filter(Boolean).join(" ")
                            : null,
                        is_approved_by_me: item.is_approved_by_me === true
                    };
                });
                setClearances(mapped);
            } catch (error) {
                setClearances([]);
                showAlert("error", "Failed to fetch clearances.");
            } finally {
                setLoading(false);
            }
        };
        fetchClearances();
    }, []);

    // Progress filter counts (match model statuses)
    const pendingCount = clearances.filter(item => item.status?.toLowerCase() === "pending").length;
    const inProgressCount = clearances.filter(item => item.status?.toLowerCase() === "in progress").length;
    const approvedCount = clearances.filter(item => item.status?.toLowerCase() === "approved").length;
    const clearedCount = clearances.filter(item => item.status?.toLowerCase() === "cleared").length;

    // Button labels and their corresponding status values
    const statusFilters = [
        { label: "Pending", value: "pending", color: "primary", count: pendingCount },
        { label: "In Progress", value: "in progress", color: "warning", count: inProgressCount },
        { label: "Approved", value: "approved", color: "success", count: approvedCount },
        { label: "Cleared", value: "cleared", color: "info", count: clearedCount },
    ];

    // Filtered and paginated data
    const filteredClearances = selectedStatus === "All"
        ? clearances
        : clearances.filter(item => item.status?.toLowerCase() === selectedStatus.toLowerCase());

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredClearances.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClearances.length / itemsPerPage);

    // Table columns (add actions column with View button)
    const columns: ColumnDefinition<ClearanceItem>[] = [
        { dataField: "name", text: "Name", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        { dataField: "purpose", text: "Purpose", sortable: true },
        { dataField: "date", text: "Date", sortable: true },
        {
            dataField: "status",
            text: "Status",
            sortable: true,
            formatter: (cell) => {
                const status = (cell || "").toString().toLowerCase();
                let badgeClass = "bg-secondary";
                if (status === "pending") badgeClass = "bg-primary";
                else if (status === "in progress") badgeClass = "bg-warning";
                else if (status === "approved") badgeClass = "bg-success";
                else if (status === "cleared") badgeClass = "bg-info";
                return (
                    <span className={`badge ${badgeClass}`}>
                        {cell}
                    </span>
                );
            }
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_cell, row) => (
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                        setSelectedClearanceId(row.id);
                        setShowDetailsModal(true);
                    }}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            {AlertComponent}
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2 d-flex justify-content-between align-items-center">
                Dashboardss
                <Button
                    variant="outline-secondary"
                    className={`ms-2 px-3 py-1 ${selectedStatus === "All" ? "bg-secondary text-light" : ''}`}
                    onClick={() => {
                        setSelectedStatus("All");
                        setCurrentPage(1);
                    }}
                >
                    All
                </Button>
            </h2>

            {/* Status Selection Buttons */}
            <Row className="g-2 g-md-4 mb-3 mb-md-4">
                {statusFilters.map((stat, index) => (
                    <Col key={index} xs={6} sm={6} md={3} className="mb-2">
                        <Button
                            variant={`outline-${stat.color}`}
                            className={`w-100 py-2 py-md-3 transition h-100 ${selectedStatus.toLowerCase() === stat.value ? `bg-${stat.color} text-light` : ''}`}
                            onClick={() => {
                                setSelectedStatus(stat.value);
                                setCurrentPage(1);
                            }}
                        >
                            <h3 className="fw-bold mb-1 fs-5 fs-md-3">{stat.count}</h3>
                            <p className="mb-0 small">{stat.label}</p>
                        </Button>
                    </Col>
                ))}
            </Row>

            {/* Clearance Table */}
            <div className="card shadow-sm mb-2">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <DynamicTable<ClearanceItem>
                        data={currentItems}
                        columns={columns}
                        keyField="id"
                        striped
                        hover
                        responsive
                        title="Clearance List"
                        showSearch
                        classes={{
                            table: 'table-sm',
                            header: 'py-2',
                            row: 'align-middle'
                        }}
                        style={{
                            cell: { padding: '0.4rem 0.6rem' }
                        }}
                    />
                )}
            </div>
            {/* PAGINATION */}
            <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                    Showing {filteredClearances.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClearances.length)} of {filteredClearances.length} entries
                </div>
                <div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="me-2"
                    >
                        Previous
                    </Button>
                    <span className="mx-2">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
            <ClearanceDetails
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                clearanceId={selectedClearanceId}
            />
        </div>
    );
};

export default Dashboard;