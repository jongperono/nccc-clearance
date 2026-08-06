import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ncccLogo from "../../assets/nccc_logo.png";
import { FaPrint, FaArrowLeft, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { apiRequest } from "../../utils/ApiService";

interface RemarkEntry {
    id?: number;
    clearance_id: number;
    employee_id: number;
    remark: string;
    createdAt?: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function getStatusStyle(status: string): { bg: string; color: string; border: string; icon: React.ReactNode } {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "cleared")
        return { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", icon: <FaCheckCircle /> };
    if (s === "pending")
        return { bg: "#fef9c3", color: "#854d0e", border: "#fde047", icon: <FaClock /> };
    if (s === "rejected" || s === "cancelled")
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", icon: <FaTimesCircle /> };
    return { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc", icon: <FaClock /> };
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: "12px",
        flexWrap: "wrap",
    }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, minWidth: "100px" }}>
            {label}
        </span>
        <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1e293b", textAlign: "right", wordBreak: "break-word", flex: 1 }}>
            {value || "—"}
        </span>
    </div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
        padding: "20px",
        marginBottom: "16px",
        ...style,
    }}>
        {children}
    </div>
);

const SectionTitle = ({ icon, title, badge }: { icon: string; title: string; badge?: number }) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
        marginBottom: "16px",
    }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", flex: 1 }}>{title}</span>
        {badge !== undefined && (
            <span style={{
                background: "#e0f2fe", color: "#0369a1",
                borderRadius: "20px", padding: "2px 10px",
                fontSize: "0.75rem", fontWeight: 700,
            }}>{badge}</span>
        )}
    </div>
);

/* ── component ───────────────────────────────────────────────────────── */

const ClearanceTrackingDetails: React.FC = () => {
    const { trackingId } = useParams<{ trackingId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remarks, setRemarks] = useState<RemarkEntry[]>([]);

    useEffect(() => {
        if (!trackingId) return;
        setLoading(true);
        setError(null);
        apiRequest<{ status: number; success: boolean; message?: string; data?: any }>(
            `/clearance/tracking/${trackingId}/`,
            "GET"
        )
            .then((res) => {
                const result = res && (res as any).data ? (res as any).data : res;
                if (!result.success) {
                    setError(result.message || "Clearance not found.");
                    setData(null);
                } else {
                    const clearanceData = result.data;
                    setData(clearanceData);
                    const clearanceId = clearanceData?.clearance?.id;
                    if (clearanceId) {
                        apiRequest<any>(`/remarks-from-clearance/${clearanceId}`, "GET")
                            .then((r) => {
                                const rows = r?.data?.data ?? r?.data ?? [];
                                setRemarks(Array.isArray(rows) ? rows : []);
                            })
                            .catch(() => setRemarks([]));
                    }
                }
            })
            .catch((err: any) => {
                setError(err.message || "Failed to fetch clearance details.");
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [trackingId]);

    /* ── loading ── */
    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#f1f5f9",
                gap: "16px",
            }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "44px", height: "44px" }} />
                <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>Loading clearance details…</p>
            </div>
        );
    }

    /* ── error ── */
    if (error) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
            }}>
                <div style={{
                    background: "#fff",
                    borderRadius: "20px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                    padding: "36px 28px",
                    maxWidth: "400px",
                    width: "100%",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                        Clearance Not Found
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "24px" }}>{error}</p>
                    <button
                        onClick={() => navigate("/clearance-tracking")}
                        style={{
                            background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "11px 24px",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <FaArrowLeft size={13} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { clearance, signatories } = data;
    const fullName = clearance.full_name
        || [clearance.first_name, clearance.middle_name, clearance.last_name].filter(Boolean).join(" ")
        || "—";
    const overallStatus = clearance.clearance_status || "Pending";
    const statusStyle = getStatusStyle(overallStatus);

    // Progress: how many signatories approved vs total
    const totalSigs = signatories.length;
    const approvedSigs = signatories.filter((s: any) => s.is_approved === true).length;
    const progressPct = totalSigs > 0 ? Math.round((approvedSigs / totalSigs) * 100) : 0;

    return (
        <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>
            {/* PRINT STYLES */}
            <style>{`
                @media print {
                    html, body { height: auto !important; background: #fff !important; }
                    @page { size: A4 portrait; margin: 1.5cm; }
                    .d-print-none { display: none !important; }
                    .print-page { background: #fff !important; padding: 0 !important; }
                    .shadow-sm { box-shadow: none !important; }
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .tracking-card { animation: fadeIn 0.3s ease forwards; }
            `}</style>

            {/* ── HERO HEADER ── */}
            <div style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                padding: "24px 20px 48px",
                position: "relative",
            }} className="d-print-none">
                {/* Back button */}
                <button
                    onClick={() => navigate("/clearance-tracking")}
                    style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: "10px",
                        color: "#fff",
                        padding: "7px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "20px",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <FaArrowLeft size={11} /> Back
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <img
                        src={ncccLogo}
                        alt="NCCC"
                        style={{ width: "52px", filter: "brightness(0) invert(1)", opacity: 0.9, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: "180px" }}>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>
                            Clearance Document
                        </p>
                        <h1 style={{ color: "#fff", fontSize: "clamp(1.05rem, 4vw, 1.5rem)", fontWeight: 800, margin: 0, lineHeight: 1.25, wordBreak: "break-word" }}>
                            {fullName}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", margin: "4px 0 0", letterSpacing: "0.04em" }}>
                            Tracking ID: <strong style={{ color: "#fff" }}>{trackingId}</strong>
                        </p>
                    </div>
                    {/* Overall status badge */}
                    <div style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1.5px solid ${statusStyle.border}`,
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                    }}>
                        {statusStyle.icon} {overallStatus}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{
                maxWidth: "760px",
                margin: "0 auto",
                padding: "0 16px 32px",
                marginTop: "-28px",
            }} className="print-page">

                {/* ── PROGRESS CARD ── */}
                {totalSigs > 0 && (
                    <Card style={{ marginBottom: "16px" }} >
                        <div className="tracking-card" style={{ animationDelay: "0ms" }}>
                            <SectionTitle icon="📊" title="Approval Progress" />
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        height: "10px",
                                        background: "#e2e8f0",
                                        borderRadius: "999px",
                                        overflow: "hidden",
                                    }}>
                                        <div style={{
                                            width: `${progressPct}%`,
                                            height: "100%",
                                            background: progressPct === 100
                                                ? "linear-gradient(90deg, #10b981, #059669)"
                                                : "linear-gradient(90deg, #2563eb, #1d4ed8)",
                                            borderRadius: "999px",
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                </div>
                                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: progressPct === 100 ? "#059669" : "#2563eb", whiteSpace: "nowrap" }}>
                                    {approvedSigs} / {totalSigs}
                                </span>
                            </div>
                            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                                {approvedSigs === totalSigs
                                    ? "✅ All signatories have approved this clearance."
                                    : `${totalSigs - approvedSigs} signator${totalSigs - approvedSigs === 1 ? "y" : "ies"} still pending.`}
                            </p>
                        </div>
                    </Card>
                )}

                {/* ── EMPLOYEE INFO ── */}
                <Card>
                    <div className="tracking-card" style={{ animationDelay: "50ms" }}>
                        <SectionTitle icon="👤" title="Employee Information" />
                        <InfoRow label="ID Number" value={String(clearance.id_number || clearance.id || "—")} />
                        <InfoRow label="Full Name" value={fullName} />
                        <InfoRow label="Email" value={clearance.email || "—"} />
                        <InfoRow label="Position" value={clearance.position || "N/A"} />
                        <InfoRow label="Immediate Head" value={clearance.immediate_head || "N/A"} />
                        <InfoRow label="Purpose" value={clearance.purpose || "N/A"} />
                    </div>
                </Card>

                {/* ── ORGANIZATION ── */}
                <Card>
                    <div className="tracking-card" style={{ animationDelay: "100ms" }}>
                        <SectionTitle icon="🏢" title="Organization Details" />
                        <InfoRow label="Company" value={clearance.Company?.name || clearance.company_id || "—"} />
                        <InfoRow label="Branch" value={clearance.Branch?.name || clearance.branch_id || "—"} />
                        <InfoRow label="Department" value={clearance.Department?.name || clearance.department_id || "—"} />
                    </div>
                </Card>

                {/* ── CLEARANCE META ── */}
                <Card>
                    <div className="tracking-card" style={{ animationDelay: "150ms" }}>
                        <SectionTitle icon="📋" title="Clearance Information" />
                        <InfoRow label="Tracking ID" value={clearance.tracking_id || "—"} />
                        <InfoRow label="Date Created" value={clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
                        <InfoRow label="Effectivity Date" value={clearance.effectivity_date ? new Date(clearance.effectivity_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
                        {/* Status inline highlight */}
                        <div style={{
                            marginTop: "12px",
                            padding: "12px 16px",
                            background: statusStyle.bg,
                            border: `1px solid ${statusStyle.border}`,
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}>
                            <span style={{ fontSize: "18px", color: statusStyle.color }}>{statusStyle.icon}</span>
                            <div>
                                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: statusStyle.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Status</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: statusStyle.color }}>{overallStatus}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* ── SIGNATORIES ── */}
                <Card>
                    <div className="tracking-card" style={{ animationDelay: "200ms" }}>
                        <SectionTitle icon="✍️" title="Signatories" badge={signatories.length} />
                        {signatories.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                <p style={{ margin: 0, fontSize: "0.88rem" }}>No signatories assigned yet.</p>
                            </div>
                        ) : (() => {
                            // Build a lookup map of employee_id -> remark string from the fetched remarks
                            const remarksMap: Record<number, string> = {};
                            remarks.forEach((r) => {
                                if (r.employee_id != null) {
                                    remarksMap[r.employee_id] = r.remark;
                                }
                            });

                            // Group signatories by department_id
                            const grouped = signatories.reduce((acc: Record<string, any[]>, sig: any) => {
                                const deptKey = sig.Employee?.department_id || "—";
                                if (!acc[deptKey]) acc[deptKey] = [];
                                acc[deptKey].push(sig);
                                return acc;
                            }, {});

                            const sortedDepts = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

                            const deptColors = [
                                { header: "#1e3a5f", light: "#e0f2fe", accent: "#0369a1" },
                                { header: "#064e3b", light: "#d1fae5", accent: "#047857" },
                                { header: "#4c1d95", light: "#ede9fe", accent: "#6d28d9" },
                                { header: "#7c2d12", light: "#ffedd5", accent: "#c2410c" },
                                { header: "#1e3a5f", light: "#fef9c3", accent: "#a16207" },
                                { header: "#1f2937", light: "#f1f5f9", accent: "#475569" },
                            ];

                            return (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {sortedDepts.map((deptKey, dIdx) => {
                                        const deptSignatories = [...grouped[deptKey]].sort((a, b) => {
                                            const roleA = (a.Employee?.role_id || "").toLowerCase();
                                            const roleB = (b.Employee?.role_id || "").toLowerCase();
                                            return roleA.localeCompare(roleB);
                                        });
                                        const palette = deptColors[dIdx % deptColors.length];

                                        return (
                                            <div key={deptKey} style={{
                                                border: `1px solid ${palette.light}`,
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                            }}>
                                                {/* Department header */}
                                                <div style={{
                                                    background: palette.header,
                                                    padding: "10px 16px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}>
                                                    <span style={{ fontSize: "14px" }}>🗂️</span>
                                                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                                        {deptKey}
                                                    </span>
                                                    <span style={{
                                                        marginLeft: "auto",
                                                        background: "rgba(255,255,255,0.2)",
                                                        color: "#fff",
                                                        borderRadius: "20px",
                                                        padding: "1px 10px",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                    }}>
                                                        {deptSignatories.length} {deptSignatories.length === 1 ? "signatory" : "signatories"}
                                                    </span>
                                                </div>

                                                {/* Signatory rows with inline remarks */}
                                                <div style={{ background: "#fff" }}>
                                                    {deptSignatories.map((sig, sIdx) => {
                                                        const emp = sig.Employee || {};
                                                        const name = emp.full_name
                                                            || [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" ")
                                                            || "—";
                                                        const role = emp.role_id || "—";
                                                        const remarkText = remarksMap[emp.employee_id] || sig.remarks || "No remarks";
                                                        const approved = sig.is_approved === true;
                                                        const sigStatus = typeof sig.status !== "undefined"
                                                            ? sig.status
                                                            : (approved ? "Approved" : "Pending");
                                                        const ss = getStatusStyle(sigStatus);
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
                                                                    background: palette.light,
                                                                    color: palette.accent,
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
                                                                            background: palette.light,
                                                                            color: palette.accent,
                                                                            borderRadius: "6px",
                                                                            padding: "1px 7px",
                                                                            fontWeight: 600,
                                                                            fontSize: "10px",
                                                                        }}>
                                                                            {role}
                                                                        </span>
                                                                    </div>
                                                                    {emp.email && (
                                                                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                                                                            <a href={`mailto:${emp.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                                                                                {emp.email}
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Inline Remarks */}
                                                                <div style={{ flex: 2, minWidth: "140px", fontSize: "12px", color: "#475569" }}>
                                                                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Remarks</div>
                                                                    <div style={{
                                                                        color: remarkText === "No remarks" ? "#cbd5e1" : "#334155",
                                                                        fontStyle: remarkText === "No remarks" ? "italic" : "normal",
                                                                        wordBreak: "break-word",
                                                                    }}>{remarkText}</div>
                                                                </div>

                                                                {/* Status badge & date */}
                                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                                                                    <div style={{
                                                                        background: ss.bg,
                                                                        color: ss.color,
                                                                        border: `1px solid ${ss.border}`,
                                                                        borderRadius: "20px",
                                                                        padding: "3px 12px",
                                                                        fontSize: "11px",
                                                                        fontWeight: 700,
                                                                        textTransform: "uppercase",
                                                                        letterSpacing: "0.06em",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        whiteSpace: "nowrap",
                                                                    }}>
                                                                        {ss.icon} {sigStatus}
                                                                    </div>
                                                                    {sig.date_approved && (
                                                                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                                                            {new Date(sig.date_approved).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </Card>

                {/* ── ACTIONS ── */}
                <div className="d-print-none" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                        onClick={() => navigate("/clearance-tracking")}
                        style={{
                            background: "#fff",
                            color: "#475569",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "11px 20px",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                        }}
                    >
                        <FaArrowLeft size={12} /> Back
                    </button>
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            padding: "11px 20px",
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                        }}
                    >
                        <FaPrint size={13} /> Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClearanceTrackingDetails;
