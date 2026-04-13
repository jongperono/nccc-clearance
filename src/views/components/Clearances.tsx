import { useState, useEffect } from "react";
import { Button, Spinner, Modal } from "react-bootstrap";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import MessageThreadModal from "./MessageThreadModal";
import ClearanceDetails from "./ClearanceDetails";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";

// Clearance item interface for table
interface ClearanceItem {
    id: number;
    tracking_id?: string; // <-- add tracking_id
    name: string;
    company: string;
    department: string;
    branch: string;
    purpose: string; // changed from type to purpose
    date: string;
    status: string;
    assigner?: string | null;
    is_approved_by_me?: boolean; // <-- add this
    [key: string]: unknown;
}

const Clearances = () => {
    const [selectedItem, setSelectedItem] = useState<ClearanceItem | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentPageMy, setCurrentPageMy] = useState(1);
    const [currentPageOther, setCurrentPageOther] = useState(1);
    const [itemsPerPage] = useState(10);
    const [myClearances, setMyClearances] = useState<ClearanceItem[]>([]);
    const [otherClearances, setOtherClearances] = useState<ClearanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClearanceId, setSelectedClearanceId] = useState<number | null>(null);
    const [canClearClearances, setCanClearClearances] = useState(false); // <-- add state for permission
    const { showAlert, AlertComponent } = useCustomAlert(); // <-- use custom alert
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [clearTarget, setClearTarget] = useState<ClearanceItem | null>(null);
    
    useEffect(() => {
        const fetchClearances = async () => {
            setLoading(true);
            
            try {
                const response = await apiRequest("/my-clearances", "GET");
                const responseData = response?.data;

                // If backend returns { clearances, other_clearances }
                if (responseData?.data?.clearances && responseData?.data?.other_clearances) {
                    const mapClearance = (item: any, isSignatory: boolean) => {
                        const clearance = item.Clearance || item || {};
                        const isApprovedByMe = isSignatory ? item.is_approved_by_me === true : false;
                        const status = item.status ?? clearance.clearance_status ?? "Pending";
                        // status should follow the model, do not override with is_approved_by_me
                        return {
                            id: clearance.id ?? item.clearance_id ?? item.id ?? 0,
                            tracking_id: clearance.tracking_id ?? item.tracking_id ?? "N/A",
                            name: [
                                clearance.first_name ?? "",
                                clearance.middle_name ?? "",
                                clearance.last_name ?? ""
                            ].filter(Boolean).join(" ") || "N/A",
                            company: clearance.Company?.name ?? clearance.company_id ?? "N/A",
                            department: clearance.Department?.name ?? clearance.department_id ?? "N/A",
                            branch: clearance.Branch?.name ?? clearance.branch_id ?? "N/A",
                            purpose: clearance.purpose ?? clearance.purpose ?? "N/A",
                            date: clearance.createdAt
                                ? new Date(clearance.createdAt).toLocaleDateString()
                                : clearance.created_at
                                    ? new Date(clearance.created_at).toLocaleDateString()
                                    : "N/A",
                            status,
                            assigner: clearance.assigner
                                ? [
                                    clearance.assigner.first_name,
                                    clearance.assigner.last_name
                                ].filter(Boolean).join(" ")
                                : null,
                            is_approved_by_me: isApprovedByMe
                        };
                    };
                    setMyClearances(responseData.data.clearances.map((item: any) => mapClearance(item, true)));
                    setOtherClearances(responseData.data.other_clearances.map((item: any) => mapClearance(item, false)));
                } else if (Array.isArray(responseData?.data)) {
                    // fallback for old response
                    const filtered = responseData.data.map((item: any) => {
                        const clearance = item.Clearance || {};
                        const isApprovedByMe = item.is_approved_by_me === true;
                        const status = item.status ?? clearance.clearance_status ?? "Pending";
                        // status should follow the model, do not override with is_approved_by_me
                        return {
                            id: clearance.id ?? item.clearance_id ?? item.id ?? 0,
                            tracking_id: clearance.tracking_id ?? item.tracking_id ?? "N/A",
                            name: [
                                clearance.first_name ?? "",
                                clearance.middle_name ?? "",
                                clearance.last_name ?? ""
                            ].filter(Boolean).join(" ") || "N/A",
                            company: clearance.Company?.name ?? clearance.company_id ?? "N/A",
                            department: clearance.Department?.name ?? clearance.department_id ?? "N/A",
                            branch: clearance.Branch?.name ?? clearance.branch_id ?? "N/A",
                            purpose: clearance.purpose ?? clearance.purpose ?? "N/A",
                            date: clearance.createdAt
                                ? new Date(clearance.createdAt).toLocaleDateString()
                                : clearance.created_at
                                    ? new Date(clearance.created_at).toLocaleDateString()
                                    : "N/A",
                            status,
                            assigner: clearance.assigner
                                ? [
                                    clearance.assigner.first_name,
                                    clearance.assigner.last_name
                                ].filter(Boolean).join(" ")
                                : null,
                            is_approved_by_me: isApprovedByMe
                        };
                    });
                    setMyClearances(filtered);
                    setOtherClearances([]);
                } else {
                    setMyClearances([]);
                    setOtherClearances([]);
                }
            } catch (error) {
                setMyClearances([]);
                setOtherClearances([]);
                console.error("Error fetching clearances:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClearances();
    }, []);

    // Fetch permission for can_clear_clearances
    useEffect(() => {
        apiRequest<any>("/check-permissions", "GET")
            .then(response => {
                const perms = response?.data?.data || {};
                setCanClearClearances(!!perms.can_clear_clearances);
            })
            .catch(() => setCanClearClearances(false));
    }, []);

    // Pagination logic for both tables
    const indexOfLastItemMy = currentPageMy * itemsPerPage;
    const indexOfFirstItemMy = indexOfLastItemMy - itemsPerPage;
    const currentItemsMy = myClearances.slice(indexOfFirstItemMy, indexOfLastItemMy);
    const totalPagesMy = Math.ceil(myClearances.length / itemsPerPage);

    const indexOfLastItemOther = currentPageOther * itemsPerPage;
    const indexOfFirstItemOther = indexOfLastItemOther - itemsPerPage;
    const currentItemsOther = otherClearances.slice(indexOfFirstItemOther, indexOfLastItemOther);
    const totalPagesOther = Math.ceil(otherClearances.length / itemsPerPage);

    // Handle review click
    const handleReviewClick = async (item: ClearanceItem) => {
        try {
            console.log('Remarkss')
            console.log(item.id)
            const remarks = await apiRequest(`/remarks-from-clearance/${item.id}`, "GET");
            console.log(remarks,'---------------adasd')
            setSelectedItem(item);
            setShowModal(true);
        } catch (error: any) {
            showAlert("error", "Failed to fetch remarks clearance: " + (error?.message || "Unknown error"));
        }
        
    };

    // Handle view details
    const handleViewDetails = (item: ClearanceItem) => {
        setSelectedClearanceId(item.id);
        setShowDetailsModal(true);
    };

    // Handle approve (only for myClearances)
    const handleApprove = async (item: ClearanceItem) => {
        try {
            await apiRequest("/my-clearance/approve", "PUT", { clearance_id: item.id });
            setMyClearances(prev =>
                prev.map(c =>
                    c.id === item.id
                        ? {
                            ...c,
                            is_approved_by_me: true,
                            status: c.status === "Pending" ? "Approved" : c.status // Optionally update status
                        }
                        : c
                )
            );
            showAlert("success", "Clearance approved successfully.");
        } catch (error: any) {
            showAlert("error", "Failed to approve clearance: " + (error?.message || "Unknown error"));
        }
    };

    // Handle clear (mark as cleared) - now uses confirmation and correct API route
    const handleClear = (item: ClearanceItem) => {
        setClearTarget(item);
        setShowConfirmClear(true);
    };

    const confirmClear = async () => {
        if (!clearTarget) return;
        try {
            await apiRequest(`/clearance/${clearTarget.id}/mark-cleared`, "PUT");
            setMyClearances(prev =>
                prev.map(c =>
                    c.id === clearTarget.id
                        ? {
                            ...c,
                            status: "Cleared"
                        }
                        : c
                )
            );
            setOtherClearances(prev =>
                prev.map(c =>
                    c.id === clearTarget.id
                        ? {
                            ...c,
                            status: "Cleared"
                        }
                        : c
                )
            );
            showAlert("success", "Clearance marked as cleared.");
        } catch (error: any) {
            showAlert("error", "Failed to clear clearance: " + (error?.message || "Unknown error"));
        } finally {
            setShowConfirmClear(false);
            setClearTarget(null);
        }
    };

    // Table columns (without Mark Cleared)
    const baseColumns: ColumnDefinition<ClearanceItem>[] = [
        { dataField: "tracking_id", text: "Tracking ID", sortable: true },
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
                // Normalize to lowercase for comparison
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
            dataField: "is_approved_by_me",
            text: "Approved By Me",
            sortable: true,
            formatter: (cell) => (
                <span className={cell ? "badge bg-success" : "badge bg-secondary"}>
                    {cell ? "Yes" : "No"}
                </span>
            )
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_cell, row) => (
                <>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleViewDetails(row)}
                        className="ms-2"
                    >
                        View
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReviewClick(row)}
                        className="ms-2"
                    >
                        Remarks
                    </Button>
                    {/* Only show Approve button if not already approved by me */}
                    {!row.is_approved_by_me && row.status !== "Approved" && row.status !== "Cleared" && (
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(row)}
                            className="ms-2"
                        >
                            Approve
                        </Button>
                    )}
                </>
            ),
        },
    ];

    // Mark Cleared column definition
    const markClearedColumn: ColumnDefinition<ClearanceItem> = {
        dataField: "mark_cleared",
        text: "Mark Cleared",
        formatter: (_cell, row) => {
            const isCleared = (row.status || "").toLowerCase() === "cleared";
            if (canClearClearances) {
                return (
                    <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleClear(row)}
                        className={`ms-2 text-light${isCleared ? " disabled" : ""}`}
                        disabled={isCleared}
                        style={isCleared ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                        Clear
                    </Button>
                );
            }
            return null;
        }
    };

    // Compose columns: insert Mark Cleared after Actions if permission is present
    const columns: ColumnDefinition<ClearanceItem>[] = canClearClearances
        ? [
            ...baseColumns,
            markClearedColumn
        ]
        : baseColumns;

    // Compose columns for Other Clearances table (remove is_approved_by_me, keep actions, insert Mark Cleared after actions if permission)
    const otherClearancesColumns: ColumnDefinition<ClearanceItem>[] = (() => {
        const filtered = baseColumns.filter(col => col.dataField !== "is_approved_by_me");
        // Replace the actions column formatter to remove Approve button
        const actionsIdx = filtered.findIndex(col => col.dataField === "actions");
        if (actionsIdx !== -1) {
            filtered[actionsIdx] = {
                ...filtered[actionsIdx],
                formatter: (_cell, row) => (
                    <>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleViewDetails(row)}
                            className="ms-2"
                        >
                            View
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReviewClick(row)}
                            className="ms-2"
                        >
                            Remarks
                        </Button>
                        {/* Approve button removed for Other Clearances */}
                    </>
                )
            };
        }
        if (canClearClearances) {
            // Insert Mark Cleared column after actions
            return [
                ...filtered.slice(0, actionsIdx + 1),
                markClearedColumn,
                ...filtered.slice(actionsIdx + 1)
            ];
        }
        return filtered;
    })();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="container-fluid p-2 p-md-4">
            {AlertComponent}
            {/* Confirmation Modal for Clear */}
            <Modal show={showConfirmClear} onHide={() => setShowConfirmClear(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Mark as Cleared</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to mark this clearance as <b>Cleared</b>?
                    <br />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmClear(false)}>
                        Cancel
                    </Button>
                    <Button variant="info" className="text-light" onClick={confirmClear}>
                        Yes, Clear
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* HEADER SECTION */}
            <div className="mb-3 mb-md-4 border-bottom pb-2 d-flex justify-content-between align-items-center">
                <h2 className="text-primary fs-4 fs-md-2">
                    Review and Process Clearance
                </h2>
            </div>

            {/* TABLE: Where I am a signatory */}
            <div className="mb-4">
                <h5 className="mb-2">Clearances</h5>
                <div className="card shadow-sm mb-2">
                    <DynamicTable<ClearanceItem>
                        data={currentItemsMy}
                        columns={columns}
                        keyField="id"
                        striped
                        hover
                        responsive
                        title="My Clearance List"
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
                </div>
                {/* PAGINATION for My Clearances */}
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                        Showing {indexOfFirstItemMy + 1} to {Math.min(indexOfLastItemMy, myClearances.length)} of {myClearances.length} entries
                    </div>
                    <div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPageMy === 1}
                            onClick={() => setCurrentPageMy(currentPageMy - 1)}
                            className="me-2"
                        >
                            Previous
                        </Button>
                        <span className="mx-2">
                            Page {currentPageMy} of {totalPagesMy}
                        </span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPageMy >= totalPagesMy}
                            onClick={() => setCurrentPageMy(currentPageMy + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* TABLE: Where I am NOT a signatory */}
            {otherClearances.length > 0 && (
                <div className="mb-4">
                    <h5 className="mb-2">Other Clearances</h5>
                    <div className="card shadow-sm mb-2">
                        <DynamicTable<ClearanceItem>
                            data={currentItemsOther}
                            columns={otherClearancesColumns}
                            keyField="id"
                            striped
                            hover
                            responsive
                            title="Other Clearance List"
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
                    </div>
                    {/* PAGINATION for Other Clearances */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div>
                            Showing {indexOfFirstItemOther + 1} to {Math.min(indexOfLastItemOther, otherClearances.length)} of {otherClearances.length} entries
                        </div>
                        <div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={currentPageOther === 1}
                                onClick={() => setCurrentPageOther(currentPageOther - 1)}
                                className="me-2"
                            >
                                Previous
                            </Button>
                            <span className="mx-2">
                                Page {currentPageOther} of {totalPagesOther}
                            </span>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={currentPageOther >= totalPagesOther}
                                onClick={() => setCurrentPageOther(currentPageOther + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <MessageThreadModal
                show={showModal}
                onHide={() => setShowModal(false)}
                selectedItem={selectedItem}
            />
            <ClearanceDetails
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                clearanceId={selectedClearanceId}
            />
        </div>
    );
};

export default Clearances;
