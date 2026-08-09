import { useState, useEffect } from "react";
import { Button, Row, Col, Spinner } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";
import ClearanceDetails from "./ClearanceDetails";

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
    display_status: string;
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
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Track window resize for progressive responsiveness
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine responsive breakpoints
    const isMobile = windowWidth < 576;
    const isTablet = windowWidth >= 576 && windowWidth < 992;
    const isDesktop = windowWidth >= 992;

    const fetchClearances = async () => {
        setLoading(true);
        try {
            const response = await apiRequest("/my-clearances", "GET") as any;
            const responseData = response?.data;

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

    useEffect(() => {
        fetchClearances();
    }, []);

    const pendingCount = clearances.filter(item => item.display_status?.toLowerCase() === "pending").length;
    const inProgressCount = clearances.filter(item => item.display_status?.toLowerCase() === "in progress").length;
    const approvedCount = clearances.filter(item => item.display_status?.toLowerCase() === "approved").length;
    const clearedCount = clearances.filter(item => item.display_status?.toLowerCase() === "cleared").length;

    const statusFilters = [
        { label: "Pending", value: "pending", color: "primary", count: pendingCount },
        { label: "In Progress", value: "in progress", color: "warning", count: inProgressCount },
        { label: "Approved", value: "approved", color: "success", count: approvedCount },
        { label: "Cleared", value: "cleared", color: "info", count: clearedCount },
    ];

    const filteredClearances = selectedStatus === "All"
        ? clearances
        : clearances.filter(item => item.display_status?.toLowerCase() === selectedStatus.toLowerCase());

    // Progressive column definitions based on screen size
    const getColumns = (): ColumnDefinition<ClearanceItem>[] => {
        // Base columns that always show
        const baseColumns: ColumnDefinition<ClearanceItem>[] = [
            {
                dataField: "tracking_id",
                text: isMobile ? "ID" : "Tracking ID",
                sortable: true,
                headerStyle: {
                    fontSize: isMobile ? "10px" : isTablet ? "12px" : "14px",
                    padding: isMobile ? "4px" : "8px"
                },
                style: {
                    fontSize: isMobile ? "9px" : isTablet ? "11px" : "13px",
                    padding: isMobile ? "4px" : "8px"
                }
            },
            {
                dataField: "name",
                text: isMobile ? "Name" : "Name",
                sortable: true,
                headerStyle: {
                    fontSize: isMobile ? "10px" : isTablet ? "12px" : "14px",
                    padding: isMobile ? "4px" : "8px"
                },
                style: {
                    fontSize: isMobile ? "9px" : isTablet ? "11px" : "13px",
                    padding: isMobile ? "4px" : "8px"
                }
            }
        ];

        // Tablet columns (add more columns for tablet and desktop)
        const tabletColumns: ColumnDefinition<ClearanceItem>[] = [
            {
                dataField: "company",
                text: "Company",
                sortable: true,
                headerStyle: { fontSize: isTablet ? "11px" : "14px", padding: "6px" },
                style: { fontSize: isTablet ? "10px" : "13px", padding: "6px" }
            },
            {
                dataField: "department",
                text: "Dept",
                sortable: true,
                headerStyle: { fontSize: isTablet ? "11px" : "14px", padding: "6px" },
                style: { fontSize: isTablet ? "10px" : "13px", padding: "6px" }
            }
        ];

        // Desktop columns (full set)
        const desktopColumns: ColumnDefinition<ClearanceItem>[] = [
            {
                dataField: "branch",
                text: "Branch",
                sortable: true,
                headerStyle: { fontSize: "14px", padding: "8px" },
                style: { fontSize: "13px", padding: "8px" }
            },
            {
                dataField: "position",
                text: "Position",
                sortable: true,
                headerStyle: { fontSize: "14px", padding: "8px" },
                style: { fontSize: "13px", padding: "8px" }
            },
            {
                dataField: "effectivity_date",
                text: "Effectivity Date",
                sortable: true,
                sortValue: (cell) => {
                    const d = new Date(cell as string);
                    return isNaN(d.getTime()) ? null : d;
                },
                headerStyle: { fontSize: "14px", padding: "8px" },
                style: { fontSize: "13px", padding: "8px" }
            }
        ];

        // Status column (progressive)
        const statusColumn: ColumnDefinition<ClearanceItem> = {
            dataField: "display_status",
            text: "Status",
            sortable: true,
            headerStyle: {
                fontSize: isMobile ? "10px" : isTablet ? "12px" : "14px",
                padding: isMobile ? "4px" : "8px"
            },
            style: {
                fontSize: isMobile ? "9px" : isTablet ? "11px" : "13px",
                padding: isMobile ? "4px" : "8px"
            },
            formatter: (cell, row) => {
                const status = (cell || "").toString().toLowerCase();
                let badgeClass = "bg-secondary";
                let label = cell;
                let emoji = "";

                if (status === "pending") {
                    badgeClass = "bg-primary";
                    label = "Pending";
                } else if (status === "in progress") {
                    badgeClass = "bg-warning text-dark";
                    label = "In Progress";
                } else if (status === "approved") {
                    badgeClass = "bg-success";
                    label = "Approved";
                } else if (status === "cleared") {
                    badgeClass = "bg-info text-dark";
                    label = "Cleared";
                }

                const isStatusOnly = isMobile && (status === "approved" || status === "cleared");

                return (
                    <span className={`badge ${badgeClass}`} style={{
                        fontSize: isMobile ? "8px" : isTablet ? "10px" : "12px",
                        padding: isMobile ? "3px 6px" : "4px 10px",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px"
                    }}>
                        {`${label}`}
                    </span>
                );
            }
        };

        // Actions column (progressive)
        const actionsColumn: ColumnDefinition<ClearanceItem> = {
            dataField: "actions" as keyof ClearanceItem,
            text: isMobile ? "" : "Actions",
            headerStyle: {
                fontSize: isMobile ? "8px" : isTablet ? "12px" : "14px",
                padding: isMobile ? "2px" : "8px",
                minWidth: isMobile ? "40px" : "auto"
            },
            style: {
                fontSize: isMobile ? "8px" : isTablet ? "11px" : "13px",
                padding: isMobile ? "2px" : "8px"
            },
            formatter: (_cell, row) => (
                <Button
                    variant="success"
                    size={isMobile ? "sm" : "sm"}
                    onClick={() => {
                        setSelectedClearanceId(row.id);
                        setShowDetailsModal(true);
                    }}
                    style={{
                        fontSize: isMobile ? "8px" : isTablet ? "11px" : "13px",
                        padding: isMobile ? "3px 8px" : "4px 12px",
                        minHeight: isMobile ? "24px" : "32px",
                        minWidth: isMobile ? "40px" : "60px",
                        borderRadius: isMobile ? "4px" : "6px",
                        width: isMobile ? "100%" : "auto"
                    }}
                >
                    {isMobile ? "👁" : "View"}
                </Button>
            )
        };

        // Build columns progressively
        let columns = [...baseColumns];

        if (!isMobile) {
            columns = [...columns, ...tabletColumns];
        }

        if (isDesktop) {
            columns = [...columns, ...desktopColumns];
        }

        columns.push(statusColumn);
        columns.push(actionsColumn);

        return columns;
    };

    return (
        <div className="container-fluid px-1 px-sm-2 px-md-3 px-lg-4 py-2 py-sm-3 py-md-4">
            {AlertComponent}

            {/* Header - Progressive */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 gap-sm-0 mb-3 mb-md-4">
                <h2 className="text-primary border-bottom pb-2 mb-0" style={{
                    fontSize: isMobile ? "1.25rem" : isTablet ? "1.5rem" : "2rem"
                }}>
                    Dashboard
                </h2>
                <Button
                    variant="outline-secondary"
                    className={`px-2 px-sm-3 ${selectedStatus === "All" ? "bg-secondary text-light" : ''}`}
                    onClick={() => setSelectedStatus("All")}
                    style={{
                        fontSize: isMobile ? "11px" : isTablet ? "13px" : "14px",
                        minHeight: isMobile ? "32px" : "40px",
                        minWidth: isMobile ? "50px" : "60px",
                        padding: isMobile ? "4px 10px" : "6px 16px",
                        width: "auto",
                    }}
                >
                    All ({clearances.length})
                </Button>
            </div>

            {/* Status Cards - Progressive Grid */}
            <Row className={`g-1 g-sm-2 g-md-3 g-lg-4 mb-3 mb-md-4`}>
                {statusFilters.map((stat, index) => (
                    <Col key={index} xs={isMobile ? 6 : 3} className="mb-1 mb-sm-2">
                        <Button
                            variant={`outline-${stat.color}`}
                            className={`w-100 py-2 py-sm-3 transition h-100 d-flex flex-column align-items-center justify-content-center ${selectedStatus.toLowerCase() === stat.value ? `bg-${stat.color} text-light` : ''
                                }`}
                            onClick={() => setSelectedStatus(stat.value)}
                            style={{
                                borderRadius: isMobile ? "8px" : "10px",
                                minHeight: isMobile ? "60px" : isTablet ? "80px" : "100px",
                                padding: isMobile ? "4px 2px" : "8px 4px",
                                borderWidth: isMobile ? "1.5px" : "2px",
                                touchAction: "manipulation",
                            }}
                        >
                            <h3 className="fw-bold mb-0" style={{
                                fontSize: isMobile ? "14px" : isTablet ? "20px" : "24px"
                            }}>
                                {stat.count}
                            </h3>
                            <p className="mb-0 small" style={{
                                fontSize: isMobile ? "8px" : isTablet ? "10px" : "12px"
                            }}>
                                {isMobile && stat.label.length > 8 ? stat.label.substring(0, 6) + '...' : stat.label}
                            </p>
                        </Button>
                    </Col>
                ))}
            </Row>

            {/* Clearance Table - Progressive */}
            <div className="card shadow-sm mb-2" style={{
                borderRadius: isMobile ? "8px" : "12px",
                overflow: "hidden"
            }}>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <div style={{
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        maxHeight: isMobile ? "400px" : "600px",
                        overflowY: "auto"
                    }}>
                        <DynamicTable<ClearanceItem>
                            data={filteredClearances}
                            columns={getColumns()}
                            keyField="id"
                            striped
                            hover
                            responsive="sm"
                            title={isMobile ? "" : "Clearance List"}
                            showSearch={!isMobile}
                            showPagination={!isMobile}
                            pageSize={isMobile ? 5 : filteredClearances.length > 10 ? 10 : filteredClearances.length}
                            paginationSize={isMobile ? "sm" : "sm"}
                            searchPlaceholder={isMobile ? "Search..." : "Search clearances..."}
                            tableStyle={{
                                fontSize: isMobile ? "9px" : isTablet ? "11px" : "14px",
                                minWidth: isMobile ? "400px" : "100%"
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Empty State - Progressive */}
            {!loading && filteredClearances.length === 0 && (
                <div className="text-center py-3 py-sm-5">
                    <div style={{ fontSize: isMobile ? "32px" : "48px", marginBottom: "8px" }}>📭</div>
                    <h5 className="text-muted" style={{ fontSize: isMobile ? "14px" : "20px" }}>
                        No clearances found
                    </h5>
                    <p className="text-muted small" style={{ fontSize: isMobile ? "11px" : "14px" }}>
                        {selectedStatus === "All"
                            ? "You don't have any clearances yet."
                            : `No ${selectedStatus} clearances available.`}
                    </p>
                    {selectedStatus !== "All" && (
                        <Button
                            variant="outline-primary"
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => setSelectedStatus("All")}
                            style={{ borderRadius: "20px", fontSize: isMobile ? "11px" : "14px" }}
                        >
                            View All Clearances
                        </Button>
                    )}
                </div>
            )}

            <ClearanceDetails
                show={showDetailsModal}
                onHide={() => {
                    setShowDetailsModal(false);
                    fetchClearances();
                }}
                clearanceId={selectedClearanceId ?? 0}
                onUpdated={fetchClearances}
            />
        </div>
    );
};

export default Dashboard;