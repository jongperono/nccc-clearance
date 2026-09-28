import { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Spinner, Modal, Badge } from "react-bootstrap";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import MessageThreadModal from "./MessageThreadModal";
import ClearanceDetails from "./ClearanceDetails";
import ClearanceEditModal from "./ClearanceEditModal";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";

// Clearance item interface for table
interface ClearanceItem {
    id: number;
    tracking_id?: string;
    name: string;
    company: string;
    department: string;
    branch: string;
    purpose: string;
    position: string;
    effectivity_date: string;
    date: string;
    status: string;
    assigner?: string | null;
    assigned_by?: number | null;
    is_approved_by_me?: boolean;
    [key: string]: unknown;
}

// Small hook to detect mobile viewport (matches Bootstrap's md breakpoint)
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined"
            ? window.innerWidth < breakpoint
            : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [breakpoint]);

    return isMobile;
};

const statusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();

    if (s === "pending") return "bg-primary";
    if (s === "in progress") return "bg-warning";
    if (s === "approved") return "bg-success";
    if (s === "cleared") return "bg-info";

    return "bg-secondary";
};

// ---------------------------------------------------------
// MOBILE SEARCH COMPONENT
// IMPORTANT: This must live OUTSIDE the Clearances component.
// Defining it inside Clearances meant a brand-new component
// function was created on every render, so React unmounted
// and remounted the <input> on every keystroke — which made
// it look like the field could only accept one character at
// a time (it lost focus after each key press).
// ---------------------------------------------------------
const MobileSearch = ({
    value,
    onChange,
    placeholder = "Search clearance..."
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
    return (
        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    🔍
                </span>

                <input
                    type="text"
                    className="form-control"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                />

                {value && (
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            onChange("")
                        }
                        aria-label="Clear search"
                    >
                        ×
                    </Button>
                )}
            </div>
        </div>
    );
};

const Clearances = () => {
    const [selectedItem, setSelectedItem] =
        useState<ClearanceItem | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [myClearances, setMyClearances] =
        useState<ClearanceItem[]>([]);

    const [otherClearances, setOtherClearances] =
        useState<ClearanceItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [selectedClearanceId, setSelectedClearanceId] =
        useState<number | null>(null);

    const [canClearClearances, setCanClearClearances] =
        useState(false);

    const [currentEmployeeId, setCurrentEmployeeId] =
        useState<number | null>(null);

    const { showAlert, AlertComponent } = useCustomAlert();

    const [showConfirmClear, setShowConfirmClear] =
        useState(false);

    const [clearTarget, setClearTarget] =
        useState<ClearanceItem | null>(null);

    const isMobile = useIsMobile();

    // Mobile search
    const [mySearchText, setMySearchText] = useState("");
    const [otherSearchText, setOtherSearchText] = useState("");

    // Stable handlers passed down to MobileSearch (avoids
    // creating a brand-new function every render, though this
    // matters less now that MobileSearch itself is stable).
    const handleMySearchChange = useCallback((value: string) => {
        setMySearchText(value);
    }, []);

    const handleOtherSearchChange = useCallback((value: string) => {
        setOtherSearchText(value);
    }, []);

    // ---------------------------------------------------------
    // FETCH CLEARANCES
    // ---------------------------------------------------------

    const fetchClearances = async () => {
        setLoading(true);

        try {
            const response =
                await apiRequest("/my-clearances", "GET") as any;

            const responseData = response?.data;

            const mapClearance = (
                item: any,
                isSignatory: boolean
            ) => {
                const clearance =
                    item.Clearance || item || {};

                const isApprovedByMe =
                    isSignatory
                        ? item.is_approved_by_me === true
                        : false;

                const status =
                    item.status ??
                    clearance.clearance_status ??
                    "Pending";

                return {
                    id:
                        clearance.id ??
                        item.clearance_id ??
                        item.id ??
                        0,

                    tracking_id:
                        clearance.tracking_id ??
                        item.tracking_id ??
                        "N/A",

                    name: [
                        clearance.first_name ?? "",
                        clearance.middle_name ?? "",
                        clearance.last_name ?? ""
                    ]
                        .filter(Boolean)
                        .join(" ") || "N/A",

                    company:
                        clearance.Company?.company_name ??
                        clearance.Company?.name ??
                        clearance.company_id ??
                        "N/A",

                    department:
                        clearance.Department?.department_name ??
                        clearance.Department?.name ??
                        clearance.department_id ??
                        "N/A",

                    branch:
                        clearance.Branch?.branch_name ??
                        clearance.Branch?.name ??
                        clearance.branch_id ??
                        "N/A",

                    purpose:
                        clearance.purpose ?? "N/A",

                    position:
                        clearance.position ?? "N/A",

                    effectivity_date:
                        clearance.effectivity_date
                            ? new Date(
                                clearance.effectivity_date
                            ).toLocaleDateString()
                            : "N/A",

                    date:
                        clearance.createdAt
                            ? new Date(
                                clearance.createdAt
                            ).toLocaleDateString()
                            : clearance.created_at
                                ? new Date(
                                    clearance.created_at
                                ).toLocaleDateString()
                                : "N/A",

                    status,

                    assigner:
                        clearance.assigner
                            ? [
                                clearance.assigner.first_name,
                                clearance.assigner.last_name
                            ]
                                .filter(Boolean)
                                .join(" ")
                            : null,

                    assigned_by:
                        clearance.assigned_by ?? null,

                    is_approved_by_me:
                        isApprovedByMe
                };
            };

            if (
                responseData?.data?.clearances &&
                responseData?.data?.other_clearances
            ) {
                setMyClearances(
                    responseData.data.clearances.map(
                        (item: any) =>
                            mapClearance(item, true)
                    )
                );

                setOtherClearances(
                    responseData.data.other_clearances.map(
                        (item: any) =>
                            mapClearance(item, false)
                    )
                );
            } else if (
                Array.isArray(responseData?.data)
            ) {
                const filtered =
                    responseData.data.map(
                        (item: any) =>
                            mapClearance(
                                item,
                                item.is_approved_by_me === true
                            )
                    );

                setMyClearances(filtered);
                setOtherClearances([]);
            } else {
                setMyClearances([]);
                setOtherClearances([]);
            }
        } catch (error) {
            setMyClearances([]);
            setOtherClearances([]);

            console.error(
                "Error fetching clearances:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClearances();
    }, []);

    // ---------------------------------------------------------
    // CHECK PERMISSIONS
    // ---------------------------------------------------------

    useEffect(() => {
        apiRequest<any>(
            "/check-permissions",
            "GET"
        )
            .then(response => {
                const perms =
                    response?.data?.data || {};

                setCanClearClearances(
                    !!perms.can_clear_clearances
                );

                setCurrentEmployeeId(
                    perms.employee_id ?? null
                );
            })
            .catch(() => {
                setCanClearClearances(false);
                setCurrentEmployeeId(null);
            });
    }, []);

    // ---------------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------------

    const handleReviewClick = useCallback(async (
        item: ClearanceItem
    ) => {
        try {
            await apiRequest(
                `/remarks-from-clearance/${item.id}`,
                "GET"
            );

            setSelectedItem(item);
            setShowModal(true);
        } catch (error: any) {
            showAlert(
                "error",
                "Failed to fetch remarks clearance: " +
                (error?.message || "Unknown error")
            );
        }
    }, [showAlert]);

    const handleViewDetails = useCallback((
        item: ClearanceItem
    ) => {
        setSelectedClearanceId(item.id);
        setShowDetailsModal(true);
    }, []);

    const handleApprove = useCallback(async (
        item: ClearanceItem
    ) => {
        try {
            await apiRequest(
                "/my-clearance/approve",
                "PUT",
                {
                    clearance_id: item.id
                }
            );

            setMyClearances(prev =>
                prev.map(c =>
                    c.id === item.id
                        ? {
                            ...c,
                            is_approved_by_me: true,
                            status:
                                c.status === "Pending"
                                    ? "Approved"
                                    : c.status
                        }
                        : c
                )
            );

            showAlert(
                "success",
                "Clearance approved successfully."
            );
        } catch (error: any) {
            showAlert(
                "error",
                "Failed to approve clearance: " +
                (error?.message || "Unknown error")
            );
        }
    }, [showAlert]);

    const handleClear = useCallback((
        item: ClearanceItem
    ) => {
        setClearTarget(item);
        setShowConfirmClear(true);
    }, []);

    const confirmClear = useCallback(async () => {
        if (!clearTarget) return;

        try {
            await apiRequest(
                `/clearance/${clearTarget.id}/mark-cleared`,
                "PUT"
            );

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

            showAlert(
                "success",
                "Clearance marked as cleared."
            );
        } catch (error: any) {
            showAlert(
                "error",
                "Failed to clear clearance: " +
                (error?.message || "Unknown error")
            );
        } finally {
            setShowConfirmClear(false);
            setClearTarget(null);
        }
    }, [clearTarget, showAlert]);

    // ---------------------------------------------------------
    // DELETE CLEARANCE
    // ---------------------------------------------------------

    const handleDeleteClearance = useCallback(async (clearanceId: number) => {
        if (!window.confirm("Are you sure you want to delete this clearance? This action cannot be undone.")) {
            return;
        }

        try {
            await apiRequest(`/clearances/${clearanceId}`, "DELETE");
            showAlert("success", "Clearance deleted successfully.");
            fetchClearances(); // Refresh the list
        } catch (error: any) {
            showAlert(
                "error",
                error?.response?.data?.message || "Failed to delete clearance."
            );
        }
    }, [showAlert]);

    // ---------------------------------------------------------
    // DESKTOP TABLE COLUMNS
    // ---------------------------------------------------------

    const baseColumns = useMemo((): ColumnDefinition<ClearanceItem>[] => [
        {
            dataField: "tracking_id",
            text: "Tracking ID",
            sortable: true
        },
        {
            dataField: "name",
            text: "Name",
            sortable: true
        },
        {
            dataField: "company",
            text: "Company",
            sortable: true
        },
        {
            dataField: "department",
            text: "Department",
            sortable: true
        },
        {
            dataField: "branch",
            text: "Branch",
            sortable: true
        },
        {
            dataField: "position",
            text: "Position",
            sortable: true
        },
        {
            dataField: "effectivity_date",
            text: "Effectivity Date",
            sortable: true,
            sortValue: (cell) => {
                const d = new Date(
                    cell as string
                );

                return isNaN(d.getTime())
                    ? null
                    : d;
            }
        },
        {
            dataField: "status",
            text: "Status",
            sortable: true,
            formatter: (cell) => (
                <span
                    className={`badge ${statusBadgeClass(
                        cell as string
                    )}`}
                >
                    {cell as string}
                </span>
            )
        },
        {
            dataField: "is_approved_by_me",
            text: "Approved By Me",
            sortable: true,
            formatter: (cell) => (
                <span
                    className={
                        cell
                            ? "badge bg-success"
                            : "badge bg-secondary"
                    }
                >
                    {cell ? "Yes" : "No"}
                </span>
            )
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_cell, row) => {
                const isCleared = (row.status || "").toLowerCase() === "cleared";
                const isAssignedByMe = currentEmployeeId !== null && row.assigned_by === currentEmployeeId;

                return (
                    <div className="d-flex flex-wrap gap-1">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() =>
                                handleViewDetails(row)
                            }
                        >
                            View
                        </Button>

                        {!isCleared && isAssignedByMe && (
                            <Button
                                variant="info"
                                size="sm"
                                onClick={() => {
                                    setSelectedClearanceId(row.id);
                                    setShowEditModal(true);
                                }}
                            >
                                Edit
                            </Button>
                        )}

                        {!isCleared && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                    handleReviewClick(row)
                                }
                            >
                                Remarks
                            </Button>
                        )}

                        {!row.is_approved_by_me &&
                            row.status !== "Approved" &&
                            !isCleared && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                        handleApprove(row)
                                    }
                                >
                                    Approve
                                </Button>
                            )}

                        {!isCleared && isAssignedByMe && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                    handleDeleteClearance(row.id)
                                }
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ], [handleViewDetails, handleReviewClick, handleApprove, currentEmployeeId]);

    const markClearedColumn = useMemo((): ColumnDefinition<ClearanceItem> => ({
        dataField: "mark_cleared",
        text: "Mark Cleared",

        formatter: (_cell, row) => {
            const isCleared =
                (row.status || "").toLowerCase() ===
                "cleared";

            if (!canClearClearances) {
                return null;
            }

            return (
                <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                        handleClear(row)
                    }
                    className={`text-light${isCleared
                        ? " disabled"
                        : ""
                        }`}
                    disabled={isCleared}
                    style={
                        isCleared
                            ? {
                                opacity: 0.5,
                                pointerEvents:
                                    "none"
                            }
                            : {}
                    }
                >
                    Clear
                </Button>
            );
        }
    }), [canClearClearances, handleClear]);

    const columns = useMemo(() =>
        canClearClearances
            ? [
                ...baseColumns,
                markClearedColumn
            ]
            : baseColumns
        , [baseColumns, canClearClearances, markClearedColumn]);

    const otherClearancesColumns = useMemo((): ColumnDefinition<ClearanceItem>[] => {
        const filtered =
            baseColumns.filter(
                col =>
                    col.dataField !==
                    "is_approved_by_me"
            );

        const actionsIdx =
            filtered.findIndex(
                col =>
                    col.dataField ===
                    "actions"
            );

        if (actionsIdx !== -1) {
            filtered[actionsIdx] = {
                ...filtered[actionsIdx],

                formatter: (
                    _cell,
                    row
                ) => {
                    const isCleared = (row.status || "").toLowerCase() === "cleared";
                    const isAssignedByMe = currentEmployeeId !== null && row.assigned_by === currentEmployeeId;

                    return (
                        <div className="d-flex flex-wrap gap-1">
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() =>
                                    handleViewDetails(
                                        row
                                    )
                                }
                            >
                                View
                            </Button>

                            {!isCleared && isAssignedByMe && (
                                <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedClearanceId(row.id);
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </Button>
                            )}

                            {!isCleared && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                        handleReviewClick(
                                            row
                                        )
                                    }
                                >
                                    Remarks
                                </Button>
                            )}

                            {!isCleared && isAssignedByMe && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                        handleDeleteClearance(row.id)
                                    }
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    );
                }
            };
        }

        if (canClearClearances) {
            return [
                ...filtered.slice(
                    0,
                    actionsIdx + 1
                ),
                markClearedColumn,
                ...filtered.slice(
                    actionsIdx + 1
                )
            ];
        }

        return filtered;
    }, [baseColumns, canClearClearances, markClearedColumn, handleViewDetails, handleReviewClick, currentEmployeeId]);

    // ---------------------------------------------------------
    // MOBILE SEARCH FILTERING
    // ---------------------------------------------------------

    const filteredMyClearances = useMemo(() => {
        const search = mySearchText.trim().toLowerCase();

        if (!search) {
            return myClearances;
        }

        return myClearances.filter(item => {
            const searchableValues = [
                item.tracking_id,
                item.name,
                item.company,
                item.department,
                item.branch,
                item.purpose,
                item.position,
                item.effectivity_date,
                item.date,
                item.status,
                item.assigner
            ];

            return searchableValues.some(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value)
                        .toLowerCase()
                        .includes(search)
            );
        });
    }, [myClearances, mySearchText]);

    const filteredOtherClearances = useMemo(() => {
        const search = otherSearchText.trim().toLowerCase();

        if (!search) {
            return otherClearances;
        }

        return otherClearances.filter(item => {
            const searchableValues = [
                item.tracking_id,
                item.name,
                item.company,
                item.department,
                item.branch,
                item.purpose,
                item.position,
                item.effectivity_date,
                item.date,
                item.status,
                item.assigner
            ];

            return searchableValues.some(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value)
                        .toLowerCase()
                        .includes(search)
            );
        });
    }, [otherClearances, otherSearchText]);

    // ---------------------------------------------------------
    // MOBILE CARD
    // ---------------------------------------------------------

    const renderCard = useCallback((
        row: ClearanceItem,
        showApprovedBadge: boolean,
        showApprove: boolean
    ) => {
        const isCleared =
            (row.status || "").toLowerCase() ===
            "cleared";
        const isAssignedByMe = currentEmployeeId !== null && row.assigned_by === currentEmployeeId;

        return (
            <div
                key={row.id}
                className="card shadow-sm mb-3"
            >
                <div className="card-body p-3">

                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div className="fw-semibold">
                                {row.name}
                            </div>

                            <div className="text-muted small">
                                {row.tracking_id}
                            </div>
                        </div>

                        <span
                            className={`badge ${statusBadgeClass(
                                row.status
                            )}`}
                        >
                            {row.status}
                        </span>
                    </div>

                    <div className="row small gy-1 mb-2">

                        <div className="col-6">
                            <span className="text-muted">
                                Company:
                            </span>{" "}
                            {row.company}
                        </div>

                        <div className="col-6">
                            <span className="text-muted">
                                Department:
                            </span>{" "}
                            {row.department}
                        </div>

                        <div className="col-6">
                            <span className="text-muted">
                                Branch:
                            </span>{" "}
                            {row.branch}
                        </div>

                        <div className="col-6">
                            <span className="text-muted">
                                Position:
                            </span>{" "}
                            {row.position}
                        </div>

                        <div className="col-6">
                            <span className="text-muted">
                                Effectivity:
                            </span>{" "}
                            {row.effectivity_date}
                        </div>

                        {showApprovedBadge && (
                            <div className="col-6">
                                <span className="text-muted">
                                    Approved by me:
                                </span>{" "}

                                <Badge
                                    bg={
                                        row.is_approved_by_me
                                            ? "success"
                                            : "secondary"
                                    }
                                >
                                    {row.is_approved_by_me
                                        ? "Yes"
                                        : "No"}
                                </Badge>
                            </div>
                        )}

                    </div>

                    <div className="d-flex flex-column gap-2 mt-2">

                        <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={() =>
                                handleViewDetails(
                                    row
                                )
                            }
                        >
                            View Details
                        </Button>

                        {!isCleared && isAssignedByMe && (
                            <Button
                                variant="info"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                    setSelectedClearanceId(row.id);
                                    setShowEditModal(true);
                                }}
                            >
                                Edit Clearance
                            </Button>
                        )}

                        {!isCleared && (
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-100"
                                onClick={() =>
                                    handleReviewClick(
                                        row
                                    )
                                }
                            >
                                Remarks
                            </Button>
                        )}

                        {showApprove &&
                            !row.is_approved_by_me &&
                            row.status !==
                            "Approved" &&
                            row.status !==
                            "Cleared" && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    className="w-100"
                                    onClick={() =>
                                        handleApprove(
                                            row
                                        )
                                    }
                                >
                                    Approve
                                </Button>
                            )}

                        {canClearClearances && (
                            <Button
                                variant="info"
                                size="sm"
                                className="w-100 text-light"
                                disabled={
                                    isCleared
                                }
                                style={
                                    isCleared
                                        ? {
                                            opacity: 0.5
                                        }
                                        : {}
                                }
                                onClick={() =>
                                    handleClear(
                                        row
                                    )
                                }
                            >
                                Mark Cleared
                            </Button>
                        )}

                        {!isCleared && isAssignedByMe && (
                            <Button
                                variant="danger"
                                size="sm"
                                className="w-100"
                                onClick={() =>
                                    handleDeleteClearance(row.id)
                                }
                            >
                                Delete
                            </Button>
                        )}

                    </div>
                </div>
            </div>
        );
    }, [handleViewDetails, handleReviewClick, handleApprove, canClearClearances, handleClear, handleDeleteClearance, currentEmployeeId]);

    // ---------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{
                    minHeight: 200
                }}
            >
                <Spinner animation="border" />
            </div>
        );
    }

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------

    return (
        <div className="container-fluid p-2 p-md-4">

            {AlertComponent}

            {/* Confirmation Modal */}
            <Modal
                show={showConfirmClear}
                onHide={() =>
                    setShowConfirmClear(false)
                }
                centered
                fullscreen={
                    isMobile
                        ? true
                        : undefined
                }
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Confirm Mark as Cleared
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to mark
                    this clearance as{" "}
                    <b>Cleared</b>?
                </Modal.Body>

                <Modal.Footer className="flex-column flex-sm-row">

                    <Button
                        variant="secondary"
                        className="w-100 w-sm-auto"
                        onClick={() =>
                            setShowConfirmClear(
                                false
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="info"
                        className="w-100 w-sm-auto text-light"
                        onClick={
                            confirmClear
                        }
                    >
                        Yes, Clear
                    </Button>

                </Modal.Footer>
            </Modal>

            {/* HEADER */}
            <div className="mb-3 mb-md-4 border-bottom pb-2">
                <h2 className="text-primary fs-5 fs-md-2 mb-0">
                    Review and Process Clearance
                </h2>
            </div>

            {/* ================================================= */}
            {/* MY CLEARANCES */}
            {/* ================================================= */}

            <div className="mb-4">

                <h5 className="mb-2 fs-6 fs-md-5">
                    Clearances
                </h5>

                {isMobile ? (
                    <>
                        <MobileSearch
                            value={
                                mySearchText
                            }
                            onChange={
                                handleMySearchChange
                            }
                            placeholder="Search my clearances..."
                        />

                        {filteredMyClearances.length > 0 ? (
                            <div>
                                {filteredMyClearances.map(row =>
                                    renderCard(
                                        row,
                                        true,
                                        true
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-muted small">
                                {mySearchText
                                    ? "No clearances match your search."
                                    : "No clearances found."}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card shadow-sm mb-2">

                        <DynamicTable<ClearanceItem>
                            data={myClearances}
                            columns={columns}
                            keyField="id"
                            striped
                            hover
                            responsive
                            title="My Clearance List"
                            showSearch
                            showPagination
                        />

                    </div>
                )}

            </div>

            {/* ================================================= */}
            {/* OTHER CLEARANCES */}
            {/* ================================================= */}

            {otherClearances.length > 0 && (
                <div className="mb-4">

                    <h5 className="mb-2 fs-6 fs-md-5">
                        Other Clearances
                    </h5>

                    {isMobile ? (
                        <>
                            <MobileSearch
                                value={
                                    otherSearchText
                                }
                                onChange={
                                    handleOtherSearchChange
                                }
                                placeholder="Search other clearances..."
                            />

                            {filteredOtherClearances.length > 0 ? (
                                <div>
                                    {filteredOtherClearances.map(row =>
                                        renderCard(
                                            row,
                                            false,
                                            false
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted small">
                                    {otherSearchText
                                        ? "No clearances match your search."
                                        : "No clearances found."}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card shadow-sm mb-2">

                            <DynamicTable<ClearanceItem>
                                data={
                                    otherClearances
                                }
                                columns={
                                    otherClearancesColumns
                                }
                                keyField="id"
                                striped
                                hover
                                responsive
                                title="Other Clearance List"
                                showSearch
                                showPagination
                            />

                        </div>
                    )}

                </div>
            )}

            {/* ================================================= */}
            {/* MODALS */}
            {/* ================================================= */}

            <MessageThreadModal
                show={showModal}
                onHide={() =>
                    setShowModal(false)
                }
                selectedItem={
                    selectedItem
                }
            />

            <ClearanceDetails
                show={
                    showDetailsModal
                }
                onHide={() =>
                    setShowDetailsModal(
                        false
                    )
                }
                clearanceId={
                    selectedClearanceId ??
                    0
                }
                onUpdated={
                    fetchClearances
                }
            />

            <ClearanceEditModal
                show={
                    showEditModal
                }
                onHide={() =>
                    setShowEditModal(
                        false
                    )
                }
                clearanceId={
                    selectedClearanceId
                }
                onUpdated={
                    fetchClearances
                }
            />

        </div>
    );
};

export default Clearances;
