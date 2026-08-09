import React, { useEffect, useRef, useState } from "react";
import { Modal, Spinner, Button, Form, ListGroup, InputGroup } from "react-bootstrap";
import { FaPrint, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useCustomAlert } from "../../utils/CustomAlert";
import ncccLogo from "../../assets/nccc_logo.png";
import { apiRequest } from "../../utils/ApiService";

interface ClearanceDetailsProps {
    show: boolean;
    onHide: () => void;
    clearanceId: number | string;
    onUpdated?: () => void;
}

const ClearanceDetails: React.FC<ClearanceDetailsProps> = ({
    show,
    onHide,
    clearanceId,
    onUpdated,
}) => {
    const wasUpdatedRef = React.useRef(false);
    const [loading, setLoading] = useState(true);
    const [clearance, setClearance] = useState<any>(null);
    const [signatories, setSignatories] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableSignatories, setAvailableSignatories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSignatory, setSelectedSignatory] = useState<any | null>(null);
    const [canAddSignatory, setCanAddSignatory] = useState(false);
    const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});
    const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
    const [approving, setApproving] = useState(false);
    const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
    const { showAlert, AlertComponent } = useCustomAlert();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) return;
        const styles = Array.from(document.styleSheets)
            .map((ss) => {
                try {
                    return Array.from(ss.cssRules).map((r) => r.cssText).join("\n");
                } catch {
                    return "";
                }
            })
            .join("\n");
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Clearance – ${clearance?.tracking_id || ""}</title>
                <style>
                    ${styles}
                    @page { size: A4 portrait; margin: 1cm 1.2cm; }
                    body { background: #fff !important; font-family: sans-serif; font-size: 11px; }
                    .no-print { display: none !important; }
                    .letter-header {
                        display: flex !important;
                        align-items: center;
                        gap: 16px;
                        padding: 10px 0 12px;
                        border-bottom: 3px solid #1e3a5f;
                        margin-bottom: 14px;
                    }
                    .letter-header img {
                        width: 64px;
                        height: auto;
                    }
                    .letter-header-text {
                        flex: 1;
                    }
                    .letter-header-company {
                        font-size: 18px;
                        font-weight: 800;
                        color: #1e3a5f;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        line-height: 1.1;
                    }
                    .letter-header-tagline {
                        font-size: 9px;
                        color: #64748b;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                        margin-top: 3px;
                    }
                    .letter-header-doctype {
                        font-size: 11px;
                        font-weight: 700;
                        color: #fff;
                        background: #1e3a5f;
                        border-radius: 6px;
                        padding: 4px 12px;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        white-space: nowrap;
                    }
                    [data-print="header"] { display: none !important; }
                    [data-print="cards"] { padding: 10px 0 0 !important; margin-top: -8px !important; }
                    [data-print="card"] {
                        padding: 10px 12px !important;
                        margin-bottom: 8px !important;
                        border-radius: 8px !important;
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                    }
                    [data-print="card-header"] {
                        margin-bottom: 8px !important;
                        padding-bottom: 6px !important;
                    }
                    [data-print="card-header"] span:first-child {
                        font-size: 13px !important;
                    }
                    [data-print="card-header"] span:last-child {
                        font-size: 12px !important;
                    }
                    [data-print="info-field"] {
                        padding: 5px 8px !important;
                        margin-bottom: 5px !important;
                        border-radius: 6px !important;
                        gap: 6px !important;
                    }
                    [data-print="info-field"] [data-print="info-label"] {
                        font-size: 8px !important;
                        margin-bottom: 1px !important;
                    }
                    [data-print="info-field"] [data-print="info-value"] {
                        font-size: 11px !important;
                    }
                    [data-print="info-field"] [data-print="info-icon"] {
                        font-size: 11px !important;
                        min-width: 14px !important;
                    }
                    [data-print="sig-row"] {
                        padding: 6px 10px !important;
                        gap: 8px !important;
                    }
                    [data-print="sig-avatar"] {
                        width: 26px !important;
                        height: 26px !important;
                        font-size: 11px !important;
                    }
                    [data-print="sig-name"] {
                        font-size: 11px !important;
                    }
                    [data-print="sig-role"] {
                        font-size: 9px !important;
                    }
                    [data-print="sig-remarks-label"] {
                        font-size: 8px !important;
                    }
                    [data-print="sig-remarks-text"] {
                        font-size: 10px !important;
                    }
                    [data-print="sig-status"] {
                        font-size: 9px !important;
                        padding: 2px 8px !important;
                    }
                    [data-print="sig-date-approved"] {
                        font-size: 8px !important;
                    }
                    [data-print="dept-header"] {
                        padding: 6px 10px 5px !important;
                    }
                    [data-print="dept-name"] {
                        font-size: 11px !important;
                    }
                    [data-print="dept-pill"] {
                        font-size: 9px !important;
                        padding: 1px 7px !important;
                    }
                    button, [data-print="no-print"] { display: none !important; }
                    [data-print="approve-btn"] { display: none !important; }
                    [data-print="add-remark-btn"] { display: none !important; }
                    [data-print="chevron"] { display: none !important; }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        const letterHeader = printWindow.document.createElement("div");
        letterHeader.className = "letter-header";
        letterHeader.innerHTML = `
            <img src="${ncccLogo}" alt="NCCC Logo" />
            <div class="letter-header-text">
                <div class="letter-header-tagline">Human Resources Department &nbsp;|&nbsp; Clearance Management System</div>
            </div>
            <div class="letter-header-doctype">${isTransfer ? "Transfer Clearance" : "Employee Clearance"}</div>
        `;
        printWindow.document.body.prepend(letterHeader);
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
    };

    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [remarkTarget, setRemarkTarget] = useState<{ employeeId: number; name: string } | null>(null);
    const [remarkText, setRemarkText] = useState("");
    const [submittingRemark, setSubmittingRemark] = useState(false);
    const refreshRemarksRef = React.useRef<(() => Promise<void>) | null>(null);

    useEffect(() => {
        if (!show) return;
        wasUpdatedRef.current = false;
        setLoading(true);
        setError(null);

        const fetchPermissions = async () => {
            try {
                const res = await apiRequest<any>("/check-permissions", "GET");
                const perms = res?.data?.data;
                if (perms) {
                    setCanAddSignatory(!!perms.can_add_signatory);
                    setCurrentEmployeeId(perms.employee_id ?? null);
                }
            } catch (err) {
                console.error("Failed to check permissions", err);
            }
        };

        const fetchDetails = async () => {
            try {
                const clearanceRes = await apiRequest(`/clearance/${clearanceId}/details`, "GET") as any;
                const apiData = clearanceRes?.data?.data || clearanceRes?.data;
                setClearance(apiData.clearance);
                setSignatories(apiData.signatories);
            } catch (err: any) {
                setError(err?.message || "Failed to fetch clearance details");
            } finally {
                setLoading(false);
            }
        };

        const fetchRemarks = async () => {
            try {
                const res = await apiRequest(`/remarks-from-clearance/${clearanceId}`, "GET") as any;
                const data: any[] = res?.data?.data || res?.data || [];
                const map: Record<number, string> = {};
                data.forEach((r: any) => {
                    if (r.employee_id != null) {
                        map[r.employee_id] = r.remark;
                    }
                });
                setRemarksMap(map);
            } catch {
                // remarks are non-critical; silently ignore errors
            }
        };

        refreshRemarksRef.current = fetchRemarks;
        fetchPermissions();
        fetchDetails();
        fetchRemarks();
    }, [show, clearanceId]);

    useEffect(() => {
        if (!showAddModal) return;
        const fetchSignatories = async () => {
            try {
                const res = await apiRequest('/signatories', 'GET') as any;
                const apiData = res?.data?.data || res?.data;
                setAvailableSignatories(Array.isArray(apiData) ? apiData : []);
            } catch (err: any) {
                showAlert('error', err?.message || 'Failed to fetch signatories');
            }
        };
        fetchSignatories();
    }, [showAddModal]);

    useEffect(() => {
        if (signatories.length === 0) return;
        const myDept = currentEmployeeId
            ? signatories.find((s: any) => (s.Employee?.employee_id ?? s.signatory_id) === currentEmployeeId)?.Employee?.department_id ?? null
            : null;
        const initial: Record<string, boolean> = {};
        signatories.forEach((s: any) => {
            const deptKey = String(s.Employee?.department_id || "—");
            if (!(deptKey in initial)) {
                initial[deptKey] = myDept !== null ? String(myDept) !== deptKey : false;
            }
        });
        setCollapsedDepts(initial);
    }, [signatories, currentEmployeeId]);

    const getStatusVariant = (status: string) => {
        const s = (status || "").toLowerCase();
        if (s === "approved" || s === "cleared") return { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" };
        if (s === "pending") return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
        if (s === "rejected" || s === "cancelled") return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
        return { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" };
    };

    const refreshDetails = async () => {
        try {
            const res = await apiRequest(`/clearance/${clearanceId}/details`, "GET") as any;
            const apiData = res?.data?.data || res?.data;
            setClearance({ ...apiData.clearance });
            setSignatories([...(apiData.signatories || [])]);
        } catch (err: any) {
            console.error("Failed to refresh clearance details", err);
        }
    };

    const handleClose = () => {
        if (wasUpdatedRef.current && onUpdated) {
            onUpdated();
        }
        onHide();
    };

    const handleApprove = async () => {
        if (!clearanceId || approving) return;
        setApproving(true);
        try {
            await apiRequest("/my-clearance/approve", "PUT", { clearance_id: clearanceId });
            wasUpdatedRef.current = true;
            await refreshDetails();
            showAlert("success", "Clearance approved successfully!");
        } catch (err: any) {
            showAlert("error", err?.message || "Failed to approve clearance.");
        } finally {
            setApproving(false);
        }
    };

    const mySignatoryRecord = currentEmployeeId
        ? signatories.find((s: any) => (s.Employee?.employee_id ?? s.signatory_id) === currentEmployeeId)
        : null;
    const hasAlreadyApproved = mySignatoryRecord?.is_approved === true;
    const canApprove = !!mySignatoryRecord && !hasAlreadyApproved;

    const fullName = clearance
        ? clearance.full_name || [clearance.first_name, clearance.middle_name, clearance.last_name].filter(Boolean).join(" ")
        : "";

    const isTransfer = (clearance?.purpose || "").toLowerCase().includes("transfer");

    // Mobile-friendly InfoField component
    const InfoField = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
        <div data-print="info-field" style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            marginBottom: "6px",
        }}>
            <span data-print="info-icon" style={{ fontSize: "14px", minWidth: "18px", marginTop: "1px" }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div data-print="info-label" style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "1px"
                }}>{label}</div>
                <div data-print="info-value" style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1e293b",
                    wordBreak: "break-word"
                }}>{value}</div>
            </div>
        </div>
    );

    return (
        <Modal show={show} onHide={handleClose} size="lg" scrollable centered dialogClassName="clearance-details-modal">
            <Modal.Header closeButton style={{
                background: isTransfer
                    ? "linear-gradient(135deg, #78350f 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                borderBottom: "none",
                padding: "12px 16px",
                position: "sticky",
                top: 0,
                zIndex: 1050,
            }}>
                <Modal.Title style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 4vw, 18px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                    minWidth: 0,
                }}>
                    <span>{isTransfer ? "🔄" : "📋"}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{isTransfer ? "Transfer Clearance" : "Clearance Details"}</span>
                    {isTransfer && (
                        <span style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            background: "rgba(255,255,255,0.25)",
                            color: "#fff",
                            borderRadius: "20px",
                            padding: "2px 8px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            border: "1px solid rgba(255,255,255,0.45)",
                            whiteSpace: "nowrap",
                        }}>
                            TRANSFER
                        </span>
                    )}
                    {clearance?.tracking_id && (
                        <span style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            background: "rgba(255,255,255,0.18)",
                            color: "#fff",
                            borderRadius: "20px",
                            padding: "2px 8px",
                            letterSpacing: "0.08em",
                            border: "1px solid rgba(255,255,255,0.3)",
                            whiteSpace: "nowrap",
                        }}>
                            {clearance.tracking_id}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: "#f1f5f9", padding: "0", overflowX: "hidden" }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted" style={{ fontSize: "14px" }}>Loading details...</div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger m-3">{error}</div>
                ) : clearance ? (
                    <>
                        {AlertComponent}
                        <div ref={printRef}>
                            {/* Header Banner - Mobile Optimized */}
                            <div data-print="header" style={{
                                background: isTransfer
                                    ? "linear-gradient(135deg, #78350f 0%, #d97706 100%)"
                                    : "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                                padding: "12px 16px 20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    gap: "12px",
                                }}>
                                    <img src={ncccLogo} alt="NCCC Logo" style={{
                                        width: "48px",
                                        height: "auto",
                                        filter: "brightness(0) invert(1)",
                                        opacity: 0.9,
                                        flexShrink: 0,
                                    }} />
                                    <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2px" }}>
                                            Official Document
                                        </div>
                                        <div style={{ color: "#fff", fontSize: "clamp(14px, 3.5vw, 18px)", fontWeight: 700, letterSpacing: "0.01em" }}>
                                            {isTransfer ? "🔄 Transfer Clearance" : "Employee Clearance"}
                                        </div>
                                        {isTransfer && (
                                            <div style={{
                                                display: "inline-block",
                                                marginTop: "4px",
                                                background: "rgba(255,255,255,0.25)",
                                                color: "#fff",
                                                borderRadius: "20px",
                                                padding: "1px 12px",
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                                border: "1px solid rgba(255,255,255,0.45)",
                                            }}>
                                                Employee Transfer
                                            </div>
                                        )}
                                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", marginTop: "2px" }}>
                                            {clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                                        </div>
                                    </div>
                                </div>
                                {/* Status Badge - Mobile Optimized */}
                                {(() => {
                                    const sv = getStatusVariant(clearance.clearance_status);
                                    return (
                                        <div style={{
                                            background: sv.bg,
                                            color: sv.color,
                                            border: `1.5px solid ${sv.border}`,
                                            borderRadius: "20px",
                                            padding: "4px 12px",
                                            fontWeight: 700,
                                            fontSize: "11px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            whiteSpace: "nowrap",
                                            alignSelf: "center",
                                        }}>
                                            {clearance.clearance_status || "Unknown"}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Cards Container - Mobile Optimized */}
                            <div data-print="cards" style={{ padding: "12px", marginTop: "-8px" }}>

                                {/* Employee Information Card */}
                                <div data-print="card" style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "14px",
                                    marginBottom: "12px",
                                }}>
                                    <div data-print="card-header" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        marginBottom: "12px",
                                        paddingBottom: "10px",
                                        borderBottom: "1px solid #e2e8f0",
                                    }}>
                                        <span style={{ fontSize: "16px" }}>👤</span>
                                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Employee Information</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <InfoField icon="🪪" label="ID Number" value={String(clearance.id_number || clearance.id || "-")} />
                                        <InfoField icon="👤" label="Full Name" value={fullName || "-"} />
                                        <InfoField icon="💼" label="Position" value={clearance.position || "N/A"} />
                                        <InfoField icon="✉️" label="Email" value={clearance.email || "-"} />
                                        <InfoField icon="🎯" label="Purpose" value={clearance.purpose || "N/A"} />
                                        {isTransfer && (
                                            <div style={{
                                                marginTop: "2px",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                background: "#fef3c7",
                                                border: "1px solid #fde68a",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: "#92400e",
                                                letterSpacing: "0.07em",
                                                textTransform: "uppercase",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }}>
                                                🔄 Transfer Clearance
                                            </div>
                                        )}
                                        <InfoField icon="👔" label="Immediate Head" value={clearance.immediate_head || "N/A"} />
                                    </div>
                                </div>

                                {/* Organization Information Card */}
                                <div data-print="card" style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "14px",
                                    marginBottom: "12px",
                                }}>
                                    <div data-print="card-header" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        marginBottom: "12px",
                                        paddingBottom: "10px",
                                        borderBottom: "1px solid #e2e8f0",
                                    }}>
                                        <span style={{ fontSize: "16px" }}>🏢</span>
                                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Organization Details</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <InfoField icon="🏙️" label="Company" value={clearance.Company?.name || clearance.company_id || "-"} />
                                        <InfoField icon="📍" label="Branch" value={clearance.Branch?.name || clearance.branch_id || "-"} />
                                        <InfoField icon="🗂️" label="Department" value={clearance.Department?.name || clearance.department_id || "-"} />
                                    </div>
                                </div>

                                {/* Clearance Meta Card */}
                                <div data-print="card" style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "14px",
                                    marginBottom: "12px",
                                }}>
                                    <div data-print="card-header" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        marginBottom: "12px",
                                        paddingBottom: "10px",
                                        borderBottom: "1px solid #e2e8f0",
                                    }}>
                                        <span style={{ fontSize: "16px" }}>📅</span>
                                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Clearance Information</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <InfoField
                                            icon="📆"
                                            label="Effectivity Date"
                                            value={clearance.effectivity_date
                                                ? new Date(clearance.effectivity_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                                : "-"}
                                        />
                                        <InfoField
                                            icon="🕐"
                                            label="Date Created"
                                            value={clearance.createdAt
                                                ? new Date(clearance.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                                : "-"}
                                        />
                                        <InfoField icon="👨‍💼" label="Assigner" value={clearance.assigner?.full_name || clearance.assigner?.first_name
                                            ? [clearance.assigner.first_name, clearance.assigner.last_name].filter(Boolean).join(" ")
                                            : "-"} />
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            background: getStatusVariant(clearance.clearance_status).bg,
                                            border: `1px solid ${getStatusVariant(clearance.clearance_status).border}`,
                                        }}>
                                            <span style={{ fontSize: "14px" }}>🔖</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: "9px",
                                                    fontWeight: 600,
                                                    color: getStatusVariant(clearance.clearance_status).color,
                                                    opacity: 0.75,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    marginBottom: "1px"
                                                }}>Status</div>
                                                <div style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    color: getStatusVariant(clearance.clearance_status).color,
                                                }}>
                                                    {clearance.clearance_status || "Unknown"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signatories Card - Mobile Optimized */}
                                <div data-print="card" style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "14px",
                                    marginBottom: "6px",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "12px",
                                        paddingBottom: "10px",
                                        borderBottom: "1px solid #e2e8f0",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontSize: "16px" }}>✍️</span>
                                            <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Signatories</span>
                                            <span style={{
                                                background: "#e0f2fe",
                                                color: "#0369a1",
                                                borderRadius: "20px",
                                                padding: "1px 8px",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                            }}>
                                                {signatories.filter(s =>
                                                    s.is_approved === true ||
                                                    (typeof s.status === "string" && s.status.toLowerCase() === "approved")
                                                ).length} / {signatories.length}
                                            </span>
                                        </div>
                                        {canAddSignatory && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setShowAddModal(true)}
                                                disabled={adding}
                                                style={{
                                                    borderRadius: "8px",
                                                    padding: "4px 12px",
                                                    fontSize: "12px",
                                                    width: "auto",
                                                }}
                                            >
                                                + Add Signatory
                                            </Button>
                                        )}
                                    </div>

                                    {signatories.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "24px 12px", color: "#94a3b8" }}>
                                            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📭</div>
                                            <div style={{ fontSize: "13px" }}>No signatories assigned yet.</div>
                                        </div>
                                    ) : (() => {
                                        const grouped = signatories.reduce((acc: Record<string, any[]>, sig) => {
                                            const deptKey = sig.Employee?.department_id || "—";
                                            if (!acc[deptKey]) acc[deptKey] = [];
                                            acc[deptKey].push(sig);
                                            return acc;
                                        }, {});

                                        const myDeptKey = currentEmployeeId
                                            ? signatories.find((s: any) => (s.Employee?.employee_id ?? s.signatory_id) === currentEmployeeId)?.Employee?.department_id ?? null
                                            : null;

                                        const sortedDepts = Object.keys(grouped).sort((a, b) => {
                                            if (myDeptKey !== null) {
                                                if (a === String(myDeptKey)) return -1;
                                                if (b === String(myDeptKey)) return 1;
                                            }
                                            return a.localeCompare(b);
                                        });

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {sortedDepts.map((deptKey) => {
                                                    const deptSignatories = [...grouped[deptKey]].sort((a, b) => {
                                                        const roleA = (a.Employee?.role_id || "").toLowerCase();
                                                        const roleB = (b.Employee?.role_id || "").toLowerCase();
                                                        return roleA.localeCompare(roleB);
                                                    });
                                                    const isMyDept = myDeptKey !== null && String(myDeptKey) === deptKey;

                                                    return (
                                                        <div key={deptKey} style={{
                                                            borderRadius: "10px",
                                                            overflow: "hidden",
                                                            border: "1px solid #e2e8f0",
                                                            boxShadow: isMyDept ? "0 0 0 2px #2563eb" : "none",
                                                        }}>
                                                            {/* Department header — click to collapse/expand */}
                                                            <div
                                                                onClick={() => setCollapsedDepts(prev => ({ ...prev, [deptKey]: !prev[deptKey] }))}
                                                                style={{
                                                                    background: "#f8fafc",
                                                                    borderBottom: collapsedDepts[deptKey] ? "none" : "1px solid #e2e8f0",
                                                                    padding: "0",
                                                                    cursor: "pointer",
                                                                    userSelect: "none",
                                                                    touchAction: "manipulation",
                                                                }}
                                                            >
                                                                {(() => {
                                                                    const approvedCount = deptSignatories.filter(s =>
                                                                        s.is_approved === true ||
                                                                        (typeof s.status === "string" && s.status.toLowerCase() === "approved")
                                                                    ).length;
                                                                    const total = deptSignatories.length;
                                                                    const pct = total > 0 ? (approvedCount / total) * 100 : 0;
                                                                    const allApproved = approvedCount === total;
                                                                    const barColor = allApproved ? "#10b981" : approvedCount > 0 ? "#3b82f6" : "#f59e0b";
                                                                    const pillBg = allApproved ? "#d1fae5" : approvedCount > 0 ? "#dbeafe" : "#fef3c7";
                                                                    const pillColor = allApproved ? "#065f46" : approvedCount > 0 ? "#1d4ed8" : "#92400e";
                                                                    return (
                                                                        <>
                                                                            <div data-print="dept-header" style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "8px",
                                                                                padding: "8px 12px",
                                                                            }}>
                                                                                <span style={{
                                                                                    width: "6px",
                                                                                    height: "6px",
                                                                                    borderRadius: "50%",
                                                                                    background: barColor,
                                                                                    flexShrink: 0,
                                                                                }} />
                                                                                <span data-print="dept-name" style={{
                                                                                    fontWeight: 700,
                                                                                    fontSize: "12px",
                                                                                    color: "#1e293b",
                                                                                    letterSpacing: "0.03em",
                                                                                    textTransform: "uppercase",
                                                                                    flex: 1,
                                                                                    minWidth: 0,
                                                                                    overflow: "hidden",
                                                                                    textOverflow: "ellipsis",
                                                                                    whiteSpace: "nowrap",
                                                                                }}>
                                                                                    {deptKey}
                                                                                    {isMyDept && (
                                                                                        <span style={{
                                                                                            marginLeft: "6px",
                                                                                            fontSize: "9px",
                                                                                            fontWeight: 600,
                                                                                            background: "#eff6ff",
                                                                                            color: "#2563eb",
                                                                                            borderRadius: "4px",
                                                                                            padding: "1px 6px",
                                                                                            border: "1px solid #bfdbfe",
                                                                                            verticalAlign: "middle",
                                                                                        }}>Your dept</span>
                                                                                    )}
                                                                                </span>
                                                                                <span data-print="dept-pill" style={{
                                                                                    fontSize: "10px",
                                                                                    fontWeight: 700,
                                                                                    color: pillColor,
                                                                                    background: pillBg,
                                                                                    borderRadius: "20px",
                                                                                    padding: "2px 8px",
                                                                                    whiteSpace: "nowrap",
                                                                                }}>
                                                                                    {approvedCount}/{total}
                                                                                </span>
                                                                                <span data-print="chevron" style={{
                                                                                    fontSize: "10px",
                                                                                    color: "#94a3b8",
                                                                                    display: "inline-block",
                                                                                    transition: "transform 0.2s",
                                                                                    transform: collapsedDepts[deptKey] ? "rotate(-90deg)" : "rotate(0deg)",
                                                                                }}>▼</span>
                                                                            </div>
                                                                            <div style={{ height: "3px", background: "#f1f5f9" }}>
                                                                                <div style={{
                                                                                    height: "100%",
                                                                                    width: `${pct}%`,
                                                                                    background: barColor,
                                                                                    transition: "width 0.4s ease",
                                                                                    borderRadius: "0 2px 2px 0",
                                                                                }} />
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* Signatory rows — hidden when collapsed */}
                                                            {!collapsedDepts[deptKey] && (
                                                                <div style={{ background: "#fff" }}>
                                                                    {deptSignatories.map((sig, sIdx) => {
                                                                        const emp = sig.Employee || {};
                                                                        const name = emp.full_name
                                                                            || [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" ")
                                                                            || "—";
                                                                        const role = emp.role_id || "—";
                                                                        const remarks = remarksMap[emp.employee_id] || sig.remarks || "No remarks";
                                                                        const status = typeof sig.status !== "undefined"
                                                                            ? sig.status
                                                                            : (sig.is_approved === true ? "Approved" : "Pending");
                                                                        const sv = getStatusVariant(status);
                                                                        const isLast = sIdx === deptSignatories.length - 1;

                                                                        return (
                                                                            <div key={emp.employee_id ?? sIdx} data-print="sig-row" style={{
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: "6px",
                                                                                padding: "10px 12px",
                                                                                borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                                                                            }}>
                                                                                {/* Top row: Avatar + Name + Role */}
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: "8px",
                                                                                    width: "100%",
                                                                                }}>
                                                                                    <div data-print="sig-avatar" style={{
                                                                                        width: "32px",
                                                                                        height: "32px",
                                                                                        borderRadius: "50%",
                                                                                        background: "#e2e8f0",
                                                                                        color: "#475569",
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        fontWeight: 700,
                                                                                        fontSize: "12px",
                                                                                        flexShrink: 0,
                                                                                    }}>
                                                                                        {name.charAt(0).toUpperCase()}
                                                                                    </div>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div data-print="sig-name" style={{
                                                                                            fontWeight: 600,
                                                                                            fontSize: "13px",
                                                                                            color: "#1e293b",
                                                                                            overflow: "hidden",
                                                                                            textOverflow: "ellipsis",
                                                                                            whiteSpace: "nowrap",
                                                                                        }}>
                                                                                            {name}
                                                                                        </div>
                                                                                        <span data-print="sig-role" style={{
                                                                                            background: "#e2e8f0",
                                                                                            color: "#475569",
                                                                                            borderRadius: "4px",
                                                                                            padding: "1px 6px",
                                                                                            fontWeight: 600,
                                                                                            fontSize: "9px",
                                                                                            whiteSpace: "nowrap",
                                                                                            display: "inline-block",
                                                                                        }}>
                                                                                            {role}
                                                                                        </span>
                                                                                    </div>
                                                                                    {/* Status badge + date approved */}
                                                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                                                                                        <div data-print="sig-status" style={{
                                                                                            background: sv.bg,
                                                                                            color: sv.color,
                                                                                            border: `1px solid ${sv.border}`,
                                                                                            borderRadius: "20px",
                                                                                            padding: "2px 8px",
                                                                                            fontSize: "9px",
                                                                                            fontWeight: 700,
                                                                                            textTransform: "uppercase",
                                                                                            letterSpacing: "0.06em",
                                                                                            whiteSpace: "nowrap",
                                                                                        }}>
                                                                                            {status}
                                                                                        </div>
                                                                                        {sig.date_approved && (
                                                                                            <div data-print="sig-date-approved" style={{
                                                                                                fontSize: "9px",
                                                                                                color: "#64748b",
                                                                                                whiteSpace: "nowrap",
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                gap: "3px",
                                                                                            }}>
                                                                                                <span>✅</span>
                                                                                                <span>{(() => {
                                                                                                    const d = new Date(sig.date_approved);
                                                                                                    const now = new Date();
                                                                                                    const diffMs = now.getTime() - d.getTime();
                                                                                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                                                                    if (diffDays === 0) return "Today";
                                                                                                    if (diffDays === 1) return "Yesterday";
                                                                                                    if (diffDays < 7) return `${diffDays}d ago`;
                                                                                                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
                                                                                                })()}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Bottom row: Remarks + Actions */}
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    flexDirection: "column",
                                                                                    gap: "4px",
                                                                                    width: "100%",
                                                                                    paddingLeft: "40px",
                                                                                }}>
                                                                                    {/* Remarks */}
                                                                                    <div style={{
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        gap: "4px",
                                                                                        fontSize: "11px",
                                                                                        color: "#475569",
                                                                                    }}>
                                                                                        <div data-print="sig-remarks-label" style={{
                                                                                            fontSize: "8px",
                                                                                            fontWeight: 700,
                                                                                            color: "#94a3b8",
                                                                                            textTransform: "uppercase",
                                                                                            letterSpacing: "0.06em",
                                                                                        }}>
                                                                                            Remarks
                                                                                        </div>
                                                                                        {currentEmployeeId === emp.employee_id && (clearance?.clearance_status || "").toLowerCase() !== "cleared" && (
                                                                                            <button
                                                                                                data-print="add-remark-btn"
                                                                                                title="Add remark"
                                                                                                onClick={() => {
                                                                                                    setRemarkTarget({ employeeId: emp.employee_id, name });
                                                                                                    setRemarkText("");
                                                                                                    setShowRemarkModal(true);
                                                                                                }}
                                                                                                style={{
                                                                                                    display: "inline-flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    width: "16px",
                                                                                                    height: "16px",
                                                                                                    borderRadius: "50%",
                                                                                                    border: "1.5px solid #93c5fd",
                                                                                                    background: "#eff6ff",
                                                                                                    color: "#2563eb",
                                                                                                    fontSize: "11px",
                                                                                                    fontWeight: 700,
                                                                                                    cursor: "pointer",
                                                                                                    lineHeight: 1,
                                                                                                    padding: 0,
                                                                                                    transition: "all 0.15s",
                                                                                                    touchAction: "manipulation",
                                                                                                }}
                                                                                                onTouchStart={(e) => {
                                                                                                    const btn = e.currentTarget as HTMLButtonElement;
                                                                                                    btn.style.background = "#2563eb";
                                                                                                    btn.style.color = "#fff";
                                                                                                }}
                                                                                                onTouchEnd={(e) => {
                                                                                                    const btn = e.currentTarget as HTMLButtonElement;
                                                                                                    btn.style.background = "#eff6ff";
                                                                                                    btn.style.color = "#2563eb";
                                                                                                }}
                                                                                            >
                                                                                                +
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                    <div data-print="sig-remarks-text" style={{
                                                                                        color: remarks === "No remarks" ? "#cbd5e1" : "#334155",
                                                                                        fontStyle: remarks === "No remarks" ? "italic" : "normal",
                                                                                        fontSize: "12px",
                                                                                        wordBreak: "break-word",
                                                                                    }}>
                                                                                        {remarks}
                                                                                    </div>

                                                                                    {/* Approve button — only show for the current user's row */}
                                                                                    {currentEmployeeId === (emp.employee_id ?? null) && (
                                                                                        sig.is_approved === true ? (
                                                                                            <div style={{
                                                                                                display: "inline-flex",
                                                                                                alignItems: "center",
                                                                                                gap: "4px",
                                                                                                background: "#d1fae5",
                                                                                                color: "#065f46",
                                                                                                border: "1px solid #6ee7b7",
                                                                                                borderRadius: "20px",
                                                                                                padding: "2px 10px",
                                                                                                fontSize: "10px",
                                                                                                fontWeight: 700,
                                                                                                whiteSpace: "nowrap",
                                                                                                alignSelf: "flex-start",
                                                                                            }}>
                                                                                                ✅ You approved
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button
                                                                                                data-print="approve-btn"
                                                                                                onClick={handleApprove}
                                                                                                disabled={approving}
                                                                                                style={{
                                                                                                    display: "inline-flex",
                                                                                                    alignItems: "center",
                                                                                                    gap: "4px",
                                                                                                    background: approving ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                                                                                                    color: "#fff",
                                                                                                    border: "none",
                                                                                                    borderRadius: "20px",
                                                                                                    padding: "4px 12px",
                                                                                                    fontSize: "11px",
                                                                                                    fontWeight: 700,
                                                                                                    cursor: approving ? "not-allowed" : "pointer",
                                                                                                    whiteSpace: "nowrap",
                                                                                                    boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
                                                                                                    transition: "opacity 0.15s",
                                                                                                    alignSelf: "flex-start",
                                                                                                    touchAction: "manipulation",
                                                                                                }}
                                                                                            >
                                                                                                {approving ? (
                                                                                                    <><Spinner as="span" animation="border" size="sm" style={{ width: "10px", height: "10px" }} /> Approving...</>
                                                                                                ) : (
                                                                                                    <>✍️ Approve</>
                                                                                                )}
                                                                                            </button>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Add Signatory Modal - Mobile Optimized */}
                        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} fullscreen="sm-down">
                            <Modal.Header closeButton>
                                <Modal.Title style={{ fontSize: "16px" }}>Add Signatory</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {AlertComponent}
                                <InputGroup className="mb-3" style={{ flexWrap: "nowrap" }}>
                                    <Form.Control
                                        placeholder="Search signatory..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ fontSize: "14px" }}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={async () => {
                                            try {
                                                const res = await apiRequest('/signatories', 'GET') as any;
                                                const apiData = res?.data?.data || res?.data;
                                                setAvailableSignatories(Array.isArray(apiData) ? apiData : []);
                                            } catch (err: any) {
                                                showAlert('error', err?.message || 'Failed to fetch signatories');
                                            }
                                        }}
                                        style={{ fontSize: "13px", whiteSpace: "nowrap" }}
                                    >
                                        Refresh
                                    </Button>
                                </InputGroup>
                                <div style={{ maxHeight: "50vh", overflowY: 'auto' }}>
                                    <ListGroup>
                                        {(availableSignatories.filter(s => {
                                            const q = searchTerm.trim().toLowerCase();
                                            if (!q) return true;
                                            const name = `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase();
                                            return name.includes(q) || String(s.employee_id).includes(q);
                                        })).map(s => (
                                            <ListGroup.Item
                                                key={s.employee_id}
                                                active={selectedSignatory?.employee_id === s.employee_id}
                                                onClick={() => setSelectedSignatory(s)}
                                                style={{ cursor: 'pointer', padding: "10px 12px" }}
                                            >
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    flexWrap: "wrap",
                                                }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: "14px", wordBreak: "break-word" }}>
                                                            {s.first_name} {s.middle_name || ''} {s.last_name}
                                                        </div>
                                                        <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                                                            ID: {s.employee_id}
                                                        </small>
                                                    </div>
                                                    {selectedSignatory?.employee_id === s.employee_id && (
                                                        <span style={{
                                                            background: "#3b82f6",
                                                            color: "#fff",
                                                            borderRadius: "4px",
                                                            padding: "2px 8px",
                                                            fontSize: "10px",
                                                            fontWeight: 600,
                                                            whiteSpace: "nowrap",
                                                        }}>Selected</span>
                                                    )}
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            </Modal.Body>
                            <Modal.Footer style={{ flexWrap: "wrap", gap: "8px" }}>
                                <Button variant="secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1, minWidth: "80px" }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={async () => {
                                        if (!selectedSignatory) {
                                            showAlert('error', 'Please select a signatory to add');
                                            return;
                                        }
                                        try {
                                            setAdding(true);
                                            await apiRequest(`/clearance/${clearanceId}/assign-template`, 'PUT', { signatory_ids: [selectedSignatory.employee_id] });
                                            setShowAddModal(false);
                                            setSelectedSignatory(null);
                                            setSearchTerm('');
                                            await refreshDetails();
                                            showAlert('success', `Signatory "${selectedSignatory.first_name} ${selectedSignatory.last_name}" added successfully`);
                                        } catch (err: any) {
                                            showAlert('error', err?.message || 'Failed to add signatory');
                                        } finally {
                                            setAdding(false);
                                        }
                                    }}
                                    disabled={adding}
                                    style={{ flex: 2, minWidth: "120px" }}
                                >
                                    {adding ? <><Spinner as="span" animation="border" size="sm" /> Adding...</> : 'Add Selected'}
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* Signatory Remark Input Modal - Mobile Optimized */}
                        <Modal show={showRemarkModal} onHide={() => setShowRemarkModal(false)} centered size="sm" fullscreen="sm-down">
                            <Modal.Header closeButton style={{
                                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                                borderBottom: "none",
                                padding: "12px 16px",
                            }}>
                                <Modal.Title style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}>
                                    <span>💬</span> Add Remark
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body style={{ padding: "16px" }}>
                                {remarkTarget && (
                                    <div style={{
                                        marginBottom: "12px",
                                        fontSize: "13px",
                                        color: "#475569",
                                        padding: "8px 12px",
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                    }}>
                                        Signatory: <strong style={{ color: "#1e293b" }}>{remarkTarget.name}</strong>
                                    </div>
                                )}
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={remarkText}
                                    onChange={(e) => setRemarkText(e.target.value)}
                                    placeholder="Type your remark..."
                                    style={{
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        padding: "10px",
                                        resize: "vertical",
                                    }}
                                />
                            </Modal.Body>
                            <Modal.Footer style={{
                                borderTop: "1px solid #e2e8f0",
                                flexWrap: "wrap",
                                gap: "8px",
                                padding: "12px 16px",
                            }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowRemarkModal(false)}
                                    style={{ borderRadius: "8px", flex: 1, minWidth: "80px" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={submittingRemark || !remarkText.trim()}
                                    style={{
                                        borderRadius: "8px",
                                        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                                        border: "none",
                                        fontWeight: 600,
                                        flex: 2,
                                        minWidth: "120px",
                                    }}
                                    onClick={async () => {
                                        if (!remarkTarget || !remarkText.trim()) return;
                                        setSubmittingRemark(true);
                                        try {
                                            await apiRequest(`/remark`, "POST", {
                                                clearance_id: clearanceId,
                                                remark: remarkText.trim(),
                                            });
                                            wasUpdatedRef.current = true;
                                            if (refreshRemarksRef.current) await refreshRemarksRef.current();
                                            setShowRemarkModal(false);
                                            setRemarkText("");
                                            setRemarkTarget(null);
                                            showAlert("success", "Remark added successfully.");
                                        } catch (err: any) {
                                            showAlert("error", err?.message || "Failed to add remark.");
                                        } finally {
                                            setSubmittingRemark(false);
                                        }
                                    }}
                                >
                                    {submittingRemark ? (
                                        <><Spinner as="span" animation="border" size="sm" style={{ width: "12px", height: "12px" }} /> Submitting...</>
                                    ) : (
                                        "Submit Remark"
                                    )}
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </>
                ) : (
                    <div className="text-center py-5 text-muted">No clearance data found.</div>
                )}
            </Modal.Body>
            <Modal.Footer style={{
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                flexWrap: "wrap",
                gap: "8px",
                padding: "10px 16px",
            }}>
                {/* Left side: Print button (only when cleared) */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", minWidth: "100px" }}>
                    {clearance && (clearance.clearance_status || "").toLowerCase() === "cleared" && (
                        <Button
                            onClick={handlePrint}
                            style={{
                                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 16px",
                                fontWeight: 700,
                                fontSize: "13px",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(20,184,166,0.35)",
                                width: "auto",
                            }}
                        >
                            <FaPrint size={13} /> Print
                        </Button>
                    )}
                </div>

                {/* Right side: Approve + Close - Mobile Optimized */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                    flex: 1,
                    justifyContent: "flex-end",
                }}>
                    {canApprove && (
                        <Button
                            variant="success"
                            onClick={handleApprove}
                            disabled={approving}
                            style={{
                                background: "linear-gradient(135deg, #059669, #10b981)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 16px",
                                fontWeight: 700,
                                fontSize: "13px",
                                boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {approving ? (
                                <><Spinner as="span" animation="border" size="sm" className="me-1" style={{ width: "14px", height: "14px" }} /> Approving...</>
                            ) : (
                                <>✅ Approve</>
                            )}
                        </Button>
                    )}
                    {hasAlreadyApproved && !canApprove && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#d1fae5",
                            color: "#065f46",
                            border: "1px solid #6ee7b7",
                            borderRadius: "8px",
                            padding: "4px 12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}>
                            ✅ Approved
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        style={{
                            borderRadius: "8px",
                            padding: "6px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                        }}
                    >
                        Close
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ClearanceDetails;