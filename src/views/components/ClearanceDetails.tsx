import React, { useEffect, useRef, useState } from "react";
import { Modal, Spinner, Button, Form, ListGroup, InputGroup } from "react-bootstrap";
import { FaPrint } from "react-icons/fa";
import { useCustomAlert } from "../../utils/CustomAlert";
import ncccLogo from "../../assets/nccc_logo.png";
import { apiRequest } from "../../utils/ApiService";

interface ClearanceDetailsProps {
    show: boolean;
    onHide: () => void;
    clearanceId: number | string;
}

const ClearanceDetails: React.FC<ClearanceDetailsProps> = ({
    show,
    onHide,
    clearanceId,
}) => {
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
                    @page { size: A4 portrait; margin: 1.5cm; }
                    body { background: #fff !important; font-family: sans-serif; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
    };

    // Signatory remark modal state
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [remarkTarget, setRemarkTarget] = useState<{ employeeId: number; name: string } | null>(null);
    const [remarkText, setRemarkText] = useState("");
    const [submittingRemark, setSubmittingRemark] = useState(false);

    // Ref to allow refreshing remarks from handlers
    const refreshRemarksRef = React.useRef<(() => Promise<void>) | null>(null);

    useEffect(() => {
        if (!show) return;
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

                // Fix: handle nested data structure
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

        // Expose for reuse after submitting a remark
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

    // Initialize collapsed state: collapse all depts except the login user's own
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

    // Shared helper — re-fetches clearance + signatories and updates state
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

    const handleApprove = async () => {
        if (!clearanceId || approving) return;
        setApproving(true);
        try {
            await apiRequest("/my-clearance/approve", "PUT", { clearance_id: clearanceId });
            await refreshDetails();
            showAlert("success", "Clearance approved successfully!");
        } catch (err: any) {
            showAlert("error", err?.message || "Failed to approve clearance.");
        } finally {
            setApproving(false);
        }
    };

    // Find this user's signatory record
    const mySignatoryRecord = currentEmployeeId
        ? signatories.find((s: any) => (s.Employee?.employee_id ?? s.signatory_id) === currentEmployeeId)
        : null;
    const hasAlreadyApproved = mySignatoryRecord?.is_approved === true;
    const canApprove = !!mySignatoryRecord && !hasAlreadyApproved;

    const fullName = clearance
        ? clearance.full_name || [clearance.first_name, clearance.middle_name, clearance.last_name].filter(Boolean).join(" ")
        : "";

    const InfoField = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
        <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            marginBottom: "8px",
        }}>
            <span style={{ fontSize: "16px", minWidth: "20px", marginTop: "1px" }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#1e293b", wordBreak: "break-word" }}>{value}</div>
            </div>
        </div>
    );

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", borderBottom: "none" }}>
                <Modal.Title style={{ color: "#fff", fontWeight: 700, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span>📋</span> Clearance Details
                    {clearance?.tracking_id && (
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            background: "rgba(255,255,255,0.18)",
                            color: "#fff",
                            borderRadius: "20px",
                            padding: "3px 12px",
                            letterSpacing: "0.08em",
                            border: "1px solid rgba(255,255,255,0.3)",
                        }}>
                            {clearance.tracking_id}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: "#f1f5f9", padding: "0" }}>
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
                        {/* Printable content wrapper */}
                        <div ref={printRef}>
                            {/* Header Banner */}
                            <div style={{
                                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                                padding: "16px 24px 28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "16px",
                            }}>
                                <img src={ncccLogo} alt="NCCC Logo" style={{ width: "70px", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
                                <div style={{ textAlign: "center", flex: 1 }}>
                                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>Official Document</div>
                                    <div style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "0.01em" }}>Employee Clearance</div>
                                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", marginTop: "4px" }}>
                                        {clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                                    </div>
                                </div>
                                {/* Status Badge */}
                                {(() => {
                                    const sv = getStatusVariant(clearance.clearance_status);
                                    return (
                                        <div style={{
                                            background: sv.bg,
                                            color: sv.color,
                                            border: `1.5px solid ${sv.border}`,
                                            borderRadius: "20px",
                                            padding: "6px 16px",
                                            fontWeight: 700,
                                            fontSize: "13px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {clearance.clearance_status || "Unknown"}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Cards Container */}
                            <div style={{ padding: "20px", marginTop: "-12px" }}>

                                {/* Employee Information Card */}
                                <div style={{
                                    background: "#fff",
                                    borderRadius: "14px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "20px",
                                    marginBottom: "16px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                                        <span style={{ fontSize: "18px" }}>👤</span>
                                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>Employee Information</span>
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <InfoField icon="🪪" label="ID Number" value={String(clearance.id_number || clearance.id || "-")} />
                                        </div>
                                        <div className="col-md-6">
                                            <InfoField icon="👤" label="Full Name" value={fullName || "-"} />
                                        </div>
                                        <div className="col-md-6">
                                            <InfoField icon="💼" label="Position" value={clearance.position || "N/A"} />
                                        </div>
                                        <div className="col-md-6">
                                            <InfoField icon="✉️" label="Email" value={clearance.email || "-"} />
                                        </div>
                                        <div className="col-md-6">
                                            <InfoField icon="🎯" label="Purpose" value={clearance.purpose || "N/A"} />
                                        </div>
                                        <div className="col-md-6">
                                            <InfoField icon="👔" label="Immediate Head" value={clearance.immediate_head || "N/A"} />
                                        </div>
                                    </div>
                                </div>

                                {/* Organization Information Card */}
                                <div style={{
                                    background: "#fff",
                                    borderRadius: "14px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "20px",
                                    marginBottom: "16px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                                        <span style={{ fontSize: "18px" }}>🏢</span>
                                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>Organization Details</span>
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-md-4">
                                            <InfoField icon="🏙️" label="Company" value={clearance.Company?.name || clearance.company_id || "-"} />
                                        </div>
                                        <div className="col-md-4">
                                            <InfoField icon="📍" label="Branch" value={clearance.Branch?.name || clearance.branch_id || "-"} />
                                        </div>
                                        <div className="col-md-4">
                                            <InfoField icon="🗂️" label="Department" value={clearance.Department?.name || clearance.department_id || "-"} />
                                        </div>
                                    </div>
                                </div>

                                {/* Clearance Meta Card */}
                                <div style={{
                                    background: "#fff",
                                    borderRadius: "14px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "20px",
                                    marginBottom: "16px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                                        <span style={{ fontSize: "18px" }}>📅</span>
                                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>Clearance Information</span>
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-md-4">
                                            <InfoField
                                                icon="📆"
                                                label="Effectivity Date"
                                                value={clearance.effectivity_date
                                                    ? new Date(clearance.effectivity_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                                    : "-"}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <InfoField
                                                icon="🕐"
                                                label="Date Created"
                                                value={clearance.createdAt
                                                    ? new Date(clearance.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                                    : "-"}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <InfoField icon="👨‍💼" label="Assigner" value={clearance.assigner?.full_name || clearance.assigner?.first_name
                                                ? [clearance.assigner.first_name, clearance.assigner.last_name].filter(Boolean).join(" ")
                                                : "-"} />
                                        </div>
                                        <div className="col-12">
                                            {/* Status inline */}
                                            {(() => {
                                                const sv = getStatusVariant(clearance.clearance_status);
                                                return (
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        padding: "10px 14px",
                                                        borderRadius: "10px",
                                                        background: sv.bg,
                                                        border: `1px solid ${sv.border}`,
                                                    }}>
                                                        <span style={{ fontSize: "16px" }}>🔖</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: "10px", fontWeight: 600, color: sv.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Status</div>
                                                            <div style={{ fontSize: "14px", fontWeight: 700, color: sv.color }}>
                                                                {clearance.clearance_status || "Unknown"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                {/* Signatories Card */}
                                <div style={{
                                    background: "#fff",
                                    borderRadius: "14px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                    padding: "20px",
                                    marginBottom: "8px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "18px" }}>✍️</span>
                                            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>Signatories</span>
                                            <span style={{
                                                background: "#e0f2fe",
                                                color: "#0369a1",
                                                borderRadius: "20px",
                                                padding: "1px 10px",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                            }}>{signatories.length}</span>
                                        </div>
                                        {canAddSignatory && (
                                            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} disabled={adding}
                                                style={{ borderRadius: "8px", padding: "5px 14px", fontSize: "13px" }}>
                                                + Add Signatory
                                            </Button>
                                        )}
                                    </div>

                                    {signatories.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8" }}>
                                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                            <div style={{ fontSize: "14px" }}>No signatories assigned yet.</div>
                                        </div>
                                    ) : (() => {
                                        // Group signatories by department_id, sort dept names, then sort by role_id within each group
                                        const grouped = signatories.reduce((acc: Record<string, any[]>, sig) => {
                                            const deptKey = sig.Employee?.department_id || "—";
                                            if (!acc[deptKey]) acc[deptKey] = [];
                                            acc[deptKey].push(sig);
                                            return acc;
                                        }, {});

                                        // Find the department of the logged-in user
                                        const myDeptKey = currentEmployeeId
                                            ? signatories.find((s: any) => (s.Employee?.employee_id ?? s.signatory_id) === currentEmployeeId)?.Employee?.department_id ?? null
                                            : null;

                                        // Sort departments alphabetically, but put the login user's department first
                                        const sortedDepts = Object.keys(grouped).sort((a, b) => {
                                            if (myDeptKey !== null) {
                                                if (a === String(myDeptKey)) return -1;
                                                if (b === String(myDeptKey)) return 1;
                                            }
                                            return a.localeCompare(b);
                                        });

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                                                                            {/* Main row */}
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px 8px" }}>
                                                                                {/* Left accent dot */}
                                                                                <span style={{
                                                                                    width: "8px", height: "8px", borderRadius: "50%",
                                                                                    background: barColor, flexShrink: 0,
                                                                                }} />
                                                                                {/* Dept name */}
                                                                                <span style={{
                                                                                    fontWeight: 700, fontSize: "13px", color: "#1e293b",
                                                                                    letterSpacing: "0.03em", textTransform: "uppercase",
                                                                                    flex: 1, minWidth: 0, overflow: "hidden",
                                                                                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                                                }}>
                                                                                    {deptKey}
                                                                                    {isMyDept && (
                                                                                        <span style={{
                                                                                            marginLeft: "8px", fontSize: "10px", fontWeight: 600,
                                                                                            background: "#eff6ff", color: "#2563eb",
                                                                                            borderRadius: "6px", padding: "1px 7px",
                                                                                            border: "1px solid #bfdbfe", verticalAlign: "middle",
                                                                                        }}>Your dept</span>
                                                                                    )}
                                                                                </span>
                                                                                {/* Count pill */}
                                                                                <span style={{
                                                                                    fontSize: "11px", fontWeight: 700,
                                                                                    color: pillColor, background: pillBg,
                                                                                    borderRadius: "20px", padding: "2px 10px",
                                                                                    whiteSpace: "nowrap",
                                                                                }}>
                                                                                    {approvedCount}/{total} approved
                                                                                </span>
                                                                                {/* Chevron */}
                                                                                <span style={{
                                                                                    fontSize: "11px", color: "#94a3b8",
                                                                                    display: "inline-block", transition: "transform 0.2s",
                                                                                    transform: collapsedDepts[deptKey] ? "rotate(-90deg)" : "rotate(0deg)",
                                                                                }}>▼</span>
                                                                            </div>
                                                                            {/* Progress bar */}
                                                                            <div style={{ height: "3px", background: "#f1f5f9" }}>
                                                                                <div style={{
                                                                                    height: "100%", width: `${pct}%`,
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
                                                                            <div key={emp.employee_id ?? sIdx} style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "12px",
                                                                                padding: "12px 16px",
                                                                                borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                                                                                flexWrap: "wrap",
                                                                            }}>
                                                                                {/* Avatar */}
                                                                                <div style={{
                                                                                    width: "36px",
                                                                                    height: "36px",
                                                                                    borderRadius: "50%",
                                                                                    background: "#e2e8f0",
                                                                                    color: "#475569",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    fontWeight: 700,
                                                                                    fontSize: "14px",
                                                                                    flexShrink: 0,
                                                                                }}>
                                                                                    {name.charAt(0).toUpperCase()}
                                                                                </div>

                                                                                {/* Name + Role */}
                                                                                <div style={{ flex: 1, minWidth: "120px" }}>
                                                                                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{name}</div>
                                                                                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                                                                        <span style={{
                                                                                            background: "#e2e8f0",
                                                                                            color: "#475569",
                                                                                            borderRadius: "6px",
                                                                                            padding: "1px 7px",
                                                                                            fontWeight: 600,
                                                                                            fontSize: "10px",
                                                                                        }}>
                                                                                            {role}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Remarks */}
                                                                                <div style={{ flex: 2, minWidth: "100px", fontSize: "12px", color: "#475569" }}>
                                                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                                                                        <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Remarks</div>
                                                                                        {currentEmployeeId === emp.employee_id && (clearance?.clearance_status || "").toLowerCase() !== "cleared" && (
                                                                                            <button
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
                                                                                                    width: "18px",
                                                                                                    height: "18px",
                                                                                                    borderRadius: "50%",
                                                                                                    border: "1.5px solid #93c5fd",
                                                                                                    background: "#eff6ff",
                                                                                                    color: "#2563eb",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: 700,
                                                                                                    cursor: "pointer",
                                                                                                    lineHeight: 1,
                                                                                                    padding: 0,
                                                                                                    transition: "all 0.15s",
                                                                                                }}
                                                                                                onMouseEnter={(e) => {
                                                                                                    (e.currentTarget as HTMLButtonElement).style.background = "#2563eb";
                                                                                                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                                                                                                }}
                                                                                                onMouseLeave={(e) => {
                                                                                                    (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
                                                                                                    (e.currentTarget as HTMLButtonElement).style.color = "#2563eb";
                                                                                                }}
                                                                                            >
                                                                                                +
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{
                                                                                        color: remarks === "No remarks" ? "#cbd5e1" : "#334155",
                                                                                        fontStyle: remarks === "No remarks" ? "italic" : "normal",
                                                                                    }}>{remarks}</div>
                                                                                </div>

                                                                                {/* Status badge */}
                                                                                <div style={{
                                                                                    background: sv.bg,
                                                                                    color: sv.color,
                                                                                    border: `1px solid ${sv.border}`,
                                                                                    borderRadius: "20px",
                                                                                    padding: "3px 12px",
                                                                                    fontSize: "11px",
                                                                                    fontWeight: 700,
                                                                                    textTransform: "uppercase",
                                                                                    letterSpacing: "0.06em",
                                                                                    whiteSpace: "nowrap",
                                                                                }}>
                                                                                    {status}
                                                                                </div>

                                                                                {/* Approve button — only show for the current user's row */}
                                                                                {currentEmployeeId === (emp.employee_id ?? null) && (
                                                                                    sig.is_approved === true ? (
                                                                                        <div style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "5px",
                                                                                            background: "#d1fae5",
                                                                                            color: "#065f46",
                                                                                            border: "1px solid #6ee7b7",
                                                                                            borderRadius: "20px",
                                                                                            padding: "3px 12px",
                                                                                            fontSize: "11px",
                                                                                            fontWeight: 700,
                                                                                            whiteSpace: "nowrap",
                                                                                        }}>
                                                                                            ✅ You approved
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={handleApprove}
                                                                                            disabled={approving}
                                                                                            style={{
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                gap: "5px",
                                                                                                background: approving ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                                                                                                color: "#fff",
                                                                                                border: "none",
                                                                                                borderRadius: "20px",
                                                                                                padding: "5px 14px",
                                                                                                fontSize: "12px",
                                                                                                fontWeight: 700,
                                                                                                cursor: approving ? "not-allowed" : "pointer",
                                                                                                whiteSpace: "nowrap",
                                                                                                boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
                                                                                                transition: "opacity 0.15s",
                                                                                            }}
                                                                                        >
                                                                                            {approving ? (
                                                                                                <><Spinner as="span" animation="border" size="sm" style={{ width: "12px", height: "12px" }} /> Approving...</>
                                                                                            ) : (
                                                                                                <>✍️ Approve</>
                                                                                            )}
                                                                                        </button>
                                                                                    )
                                                                                )}
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

                            </div>{/* end cards container */}
                        </div>{/* end printRef wrapper */}

                        {/* Add Signatory Modal */}
                        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Add Signatory</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {AlertComponent}
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="Search signatory by name or ID"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="outline-secondary" onClick={async () => {
                                        try {
                                            const res = await apiRequest('/signatories', 'GET') as any;
                                            const apiData = res?.data?.data || res?.data;
                                            setAvailableSignatories(Array.isArray(apiData) ? apiData : []);
                                        } catch (err: any) {
                                            showAlert('error', err?.message || 'Failed to fetch signatories');
                                        }
                                    }}>Refresh</Button>
                                </InputGroup>
                                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
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
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-semibold">{s.first_name} {s.middle_name || ''} {s.last_name}</div>
                                                        <small className="text-muted">ID: {s.employee_id} — {s.company_id || ''} / {s.branch_id || ''}</small>
                                                    </div>
                                                    <div>
                                                        {selectedSignatory?.employee_id === s.employee_id ? <span className="badge bg-primary">Selected</span> : null}
                                                    </div>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
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
                                >
                                    {adding ? <><Spinner as="span" animation="border" size="sm" /> Adding...</> : 'Add Selected'}
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* Signatory Remark Input Modal */}
                        <Modal show={showRemarkModal} onHide={() => setShowRemarkModal(false)} centered size="sm">
                            <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", borderBottom: "none" }}>
                                <Modal.Title style={{ color: "#fff", fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>💬</span> Add Remark
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {remarkTarget && (
                                    <div style={{ marginBottom: "12px", fontSize: "13px", color: "#475569" }}>
                                        Signatory: <strong style={{ color: "#1e293b" }}>{remarkTarget.name}</strong>
                                    </div>
                                )}
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={remarkText}
                                    onChange={(e) => setRemarkText(e.target.value)}
                                    placeholder="Type your remark..."
                                    style={{ borderRadius: "8px", fontSize: "14px" }}
                                />
                            </Modal.Body>
                            <Modal.Footer style={{ borderTop: "1px solid #e2e8f0" }}>
                                <Button variant="secondary" size="sm" onClick={() => setShowRemarkModal(false)} style={{ borderRadius: "8px" }}>
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
                                    }}
                                    onClick={async () => {
                                        if (!remarkTarget || !remarkText.trim()) return;
                                        setSubmittingRemark(true);
                                        try {
                                            await apiRequest(`/remark`, "POST", {
                                                clearance_id: clearanceId,
                                                remark: remarkText.trim(),
                                            });
                                            // Refresh remarks map
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
            <Modal.Footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                {/* Left side: Print button (only when cleared) */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                    {clearance && (clearance.clearance_status || "").toLowerCase() === "cleared" && (
                        <Button
                            onClick={handlePrint}
                            style={{
                                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 20px",
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                                boxShadow: "0 2px 8px rgba(20,184,166,0.35)",
                            }}
                        >
                            <FaPrint size={14} /> Print Clearance
                        </Button>
                    )}
                </div>

                {/* Right side: Approve / Already Approved + Close */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {canApprove && (
                        <Button
                            variant="success"
                            onClick={handleApprove}
                            disabled={approving}
                            style={{
                                background: "linear-gradient(135deg, #059669, #10b981)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 20px",
                                fontWeight: 700,
                                fontSize: "14px",
                                boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
                            }}
                        >
                            {approving ? (
                                <><Spinner as="span" animation="border" size="sm" className="me-2" />Approving...</>
                            ) : (
                                <>✅ Approve Clearance</>
                            )}
                        </Button>
                    )}
                    {hasAlreadyApproved && !canApprove && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#d1fae5",
                            color: "#065f46",
                            border: "1px solid #6ee7b7",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                        }}>
                            ✅ You have already approved this clearance
                        </div>
                    )}
                    <Button variant="secondary" onClick={onHide} style={{ borderRadius: "8px" }}>
                        Close
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ClearanceDetails;
