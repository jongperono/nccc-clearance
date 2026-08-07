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
    tracking_id: string;
    name: string;
    company: string;
    department: string;
    branch: string;
    position: string;
    effectivity_date: string;
    purpose: string;
    date: string;
    status: string;
    display_status: string; // personal status for the logged-in user
    assigner?: string | null;
    is_approved_by_me?: boolean;
}

const Dashboard = () => {
    const [selectedStatus, setSelectedStatus] = useState("All");
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
                const response = await apiRequest("/my-clearances", "GET") as any;
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
                    const overallStatus = item.status ?? clearance.clearance_status ?? "Pending";
                    const isApprovedByMe = item.is_approved_by_me === true;

                    // Personal display status: if the logged-in user has already approved
                    // this clearance, show "Approved" regardless of overall progress.
                    // If overall is Cleared, always show Cleared.
                    let displayStatus: string;
                    if (overallStatus?.toLowerCase() === "cleared") {
                        displayStatus = "Cleared";
                    } else if (isApprovedByMe) {
                        displayStatus = "Approved";
                    } else {
                        displayStatus = overallStatus;
                    }

                    return {
                        id: clearance.id ?? item.clearance_id ?? item.id ?? 0,
                        tracking_id: clearance.tracking_id ?? "N/A",
                        name: [
                            clearance.first_name ?? "",
                            clearance.middle_name ?? "",
                            clearance.last_name ?? ""
                        ].filter(Boolean).join(" ") || "N/A",
                        company: clearance.Company?.name ?? clearance.company_id ?? "N/A",
                        department: clearance.Department?.name ?? clearance.department_id ?? "N/A",
                        branch: clearance.Branch?.name ?? clearance.branch_id ?? "N/A",
                        position: clearance.position ?? "N/A",
                        effectivity_date: clearance.effectivity_date
                            ? new Date(clearance.effectivity_date).toLocaleDateString()
                            : "N/A",
                        purpose: clearance.purpose ?? clearance.type ?? "N/A",
                        date: clearance.createdAt
                            ? new Date(clearance.createdAt).toLocaleDateString()
                            : clearance.created_at
                                ? new Date(clearance.created_at).toLocaleDateString()
                                : "N/A",
                        status: overallStatus,
                        display_status: displayStatus,
                        assigner: clearance.assigner
                            ? [
                                clearance.assigner.first_name,
                                clearance.assigner.last_name
                            ].filter(Boolean).join(" ")
                            : null,
                        is_approved_by_me: isApprovedByMe
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

    // Progress filter counts — based on the logged-in user's personal status
    const pendingCount = clearances.filter(item => item.display_status?.toLowerCase() === "pending").length;
    const inProgressCount = clearances.filter(item => item.display_status?.toLowerCase() === "in progress").length;
    const approvedCount = clearances.filter(item => item.display_status?.toLowerCase() === "approved").length;
    const clearedCount = clearances.filter(item => item.display_status?.toLowerCase() === "cleared").length;

    // Button labels and their corresponding display_status values
    const statusFilters = [
        { label: "Pending", value: "pending", color: "primary", count: pendingCount },
        { label: "In Progress", value: "in progress", color: "warning", count: inProgressCount },
        { label: "Approved by Me", value: "approved", color: "success", count: approvedCount },
        { label: "Cleared", value: "cleared", color: "info", count: clearedCount },
    ];

    // Filtered data — filter by display_status so "Approved by Me" button works correctly
    const filteredClearances = selectedStatus === "All"
        ? clearances
        : clearances.filter(item => item.display_status?.toLowerCase() === selectedStatus.toLowerCase());

    // Table columns (add actions column with View button)
    const columns: ColumnDefinition<ClearanceItem>[] = [
        { dataField: "tracking_id", text: "Tracking ID", sortable: true },
        { dataField: "name", text: "Name", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        { dataField: "position", text: "Position", sortable: true },
        {
            dataField: "effectivity_date",
            text: "Effectivity Date",
            sortable: true,
            sortValue: (cell) => {
                const d = new Date(cell as string);
                return isNaN(d.getTime()) ? null : d;
            }
        },
        {
            dataField: "display_status",
            text: "Status",
            sortable: true,
            formatter: (cell, row) => {
                const status = (cell || "").toString().toLowerCase();
                let badgeClass = "bg-secondary";
                let label = cell;
                if (status === "pending") badgeClass = "bg-primary";
                else if (status === "in progress") badgeClass = "bg-warning text-dark";
                else if (status === "approved") {
                    badgeClass = "bg-success";
                    label = row.is_approved_by_me ? "Approved by Me" : "Approved";
                }
                else if (status === "cleared") badgeClass = "bg-info text-dark";
                return (
                    <span className={`badge ${badgeClass}`}>
                        {label}
                    </span>
                );
            }
        },
        {
            dataField: "actions" as keyof ClearanceItem,
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
                Dashboard
                <Button
                    variant="outline-secondary"
                    className={`ms-2 px-3 py-1 ${selectedStatus === "All" ? "bg-secondary text-light" : ''}`}
                    onClick={() => {
                        setSelectedStatus("All");
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
                        data={filteredClearances}
                        columns={columns}
                        keyField="id"
                        striped
                        hover
                        responsive
                        title="Clearance List"
                        showSearch
                        showPagination
                        pageSize={10}
                    />
                )}
            </div>
            <ClearanceDetails
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                clearanceId={selectedClearanceId ?? 0}
            />
        </div>
    );
};

export default Dashboard;