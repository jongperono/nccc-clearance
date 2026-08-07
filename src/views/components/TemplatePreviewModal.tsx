import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import ncccLogo from "../../assets/nccc_logo.png";
import { apiRequest } from "../../utils/ApiService";

// Modal for previewing template before creation
interface Signatory {
    id: string;
    full_name: string;
    remarks: string;
}

interface TemplateData {
    title: string;
    purpose: string;
    footer_message?: string;
    creator_employee_id?: number | string;
}

interface TemplatePreviewModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: (data: any) => void;
    templateData: TemplateData;
    selectedSignatories: Signatory[];
    formDataWithIds?: any;
    onConfirm?: () => void;
    showConfirmButton?: boolean;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
    show,
    onHide,
    onSuccess,
    templateData,
    selectedSignatories,
    formDataWithIds,
    showConfirmButton = true,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creator, setCreator] = useState<{
        id: string;
        name: string;
        company: string;
        branch: string;
        department: string;
        datePrepared: string;
    }>({
        id: "-",
        name: "-",
        company: "-",
        branch: "-",
        department: "-",
        datePrepared: new Date().toLocaleDateString(),
    });

    useEffect(() => {
        const employeeId =
            templateData?.creator_employee_id != null
                ? String(templateData.creator_employee_id)
                : localStorage.getItem("employee_id");
        if (!employeeId) return;
        apiRequest<any>(`/employee/${employeeId}`, "GET")
            .then((res) => {
                const emp = res?.data?.data ?? res?.data ?? res;
                if (emp) {
                    setCreator({
                        id: String(emp.employee_id ?? employeeId),
                        name:
                            emp.full_name ||
                            [emp.first_name, emp.middle_name, emp.last_name]
                                .filter(Boolean)
                                .join(" ") ||
                            "-",
                        company: emp.company_id ?? "-",
                        branch: emp.branch_id ?? "-",
                        department: emp.department_id ?? "-",
                        datePrepared: new Date().toLocaleDateString(),
                    });
                }
            })
            .catch(() => { });
    }, [templateData?.creator_employee_id]);

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            setError(null);

            const signatoryIds = selectedSignatories.map(
                (sig: any) => sig.id || sig.employee_id
            );

            const payloadSource = formDataWithIds || templateData;
            const templatePayload = {
                title: payloadSource.title,
                purpose: payloadSource.purpose,
                footer_message: payloadSource.footer_message || "",
                signatories: signatoryIds,
            };

            const response: any = await apiRequest("/template", "POST", templatePayload);
            if (onSuccess) {
                onSuccess(response.data);
            }

            onHide();
            window.location.reload();
        } catch (error: any) {
            console.error("Error confirming template:", error);
            setError(error?.message || "Failed to create template");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── helpers ──────────────────────────────────────────────────────────────

    const InfoField = ({
        icon,
        label,
        value,
    }: {
        icon: string;
        label: string;
        value: string;
    }) => (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                marginBottom: "8px",
            }}
        >
            <span style={{ fontSize: "16px", minWidth: "20px", marginTop: "1px" }}>
                {icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "2px",
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1e293b",
                        wordBreak: "break-word",
                    }}
                >
                    {value}
                </div>
            </div>
        </div>
    );

    const deptColors = [
        { header: "#1e3a5f", light: "#e0f2fe", accent: "#0369a1" },
        { header: "#064e3b", light: "#d1fae5", accent: "#047857" },
        { header: "#4c1d95", light: "#ede9fe", accent: "#6d28d9" },
        { header: "#7c2d12", light: "#ffedd5", accent: "#c2410c" },
        { header: "#1e3a5f", light: "#fef9c3", accent: "#a16207" },
        { header: "#1f2937", light: "#f1f5f9", accent: "#475569" },
    ];

    // Group signatories by a "department" key (use a placeholder since template
    // signatories may not carry department info yet)
    const signatoryList = (selectedSignatories as any[]).map((sig) => ({
        ...sig,
        _name:
            sig.full_name ||
            [sig.first_name, sig.middle_name, sig.last_name]
                .filter(Boolean)
                .join(" ") ||
            "—",
        _role: sig.role_id || sig.role || "—",
        _dept: sig.department_id || sig.department || "General",
        _remarks: sig.remarks || "—",
    }));

    const grouped = signatoryList.reduce((acc: Record<string, any[]>, sig) => {
        const key = sig._dept;
        if (!acc[key]) acc[key] = [];
        acc[key].push(sig);
        return acc;
    }, {});

    const sortedDepts = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <Modal show={show} onHide={onHide} size="lg">
            {/* Header */}
            <Modal.Header
                closeButton
                style={{
                    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                    borderBottom: "none",
                }}
            >
                <Modal.Title
                    style={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <span>📄</span> Template Preview
                </Modal.Title>
            </Modal.Header>

            {/* Body */}
            <Modal.Body style={{ background: "#f1f5f9", padding: "0" }}>
                {/* Banner */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                        padding: "16px 24px 28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}
                >
                    <img
                        src={ncccLogo}
                        alt="NCCC Logo"
                        style={{
                            width: "70px",
                            filter: "brightness(0) invert(1)",
                            opacity: 0.9,
                        }}
                    />
                    <div style={{ textAlign: "center", flex: 1 }}>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "11px",
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >
                            Clearance Template
                        </div>
                        <div
                            style={{
                                color: "#fff",
                                fontSize: "22px",
                                fontWeight: 700,
                                letterSpacing: "0.01em",
                            }}
                        >
                            {templateData?.title || "Untitled Template"}
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.65)",
                                fontSize: "12px",
                                marginTop: "4px",
                            }}
                        >
                            {creator.datePrepared}
                        </div>
                    </div>
                    {/* Purpose badge */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            border: "1.5px solid rgba(255,255,255,0.35)",
                            borderRadius: "20px",
                            padding: "6px 16px",
                            fontWeight: 600,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                            maxWidth: "140px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {templateData?.purpose || "N/A"}
                    </div>
                </div>

                {/* Cards container */}
                <div style={{ padding: "20px", marginTop: "-12px" }}>

                    {/* Creator / Employee Information Card */}
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "14px",
                            boxShadow:
                                "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                            padding: "20px",
                            marginBottom: "16px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "16px",
                                paddingBottom: "12px",
                                borderBottom: "1px solid #e2e8f0",
                            }}
                        >
                            <span style={{ fontSize: "18px" }}>👤</span>
                            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                                Creator Information
                            </span>
                        </div>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <InfoField icon="🪪" label="Employee ID" value={creator.id} />
                            </div>
                            <div className="col-md-6">
                                <InfoField icon="👤" label="Prepared By" value={creator.name} />
                            </div>
                            <div className="col-md-6">
                                <InfoField icon="🎯" label="Purpose" value={templateData?.purpose || "N/A"} />
                            </div>
                            <div className="col-md-6">
                                <InfoField icon="📆" label="Date Prepared" value={creator.datePrepared} />
                            </div>
                        </div>
                    </div>

                    {/* Organization Details Card */}
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "14px",
                            boxShadow:
                                "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                            padding: "20px",
                            marginBottom: "16px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "16px",
                                paddingBottom: "12px",
                                borderBottom: "1px solid #e2e8f0",
                            }}
                        >
                            <span style={{ fontSize: "18px" }}>🏢</span>
                            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                                Organization Details
                            </span>
                        </div>
                        <div className="row g-2">
                            <div className="col-md-4">
                                <InfoField icon="🏙️" label="Company" value={creator.company} />
                            </div>
                            <div className="col-md-4">
                                <InfoField icon="📍" label="Branch" value={creator.branch} />
                            </div>
                            <div className="col-md-4">
                                <InfoField icon="🗂️" label="Department" value={creator.department} />
                            </div>
                        </div>
                    </div>

                    {/* Footer message Card (only if present) */}
                    {templateData?.footer_message && (
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "14px",
                                boxShadow:
                                    "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                                padding: "20px",
                                marginBottom: "16px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "12px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>📝</span>
                                <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                                    Footer Message
                                </span>
                            </div>
                            <p style={{ fontSize: "14px", color: "#475569", marginBottom: 0 }}>
                                {templateData.footer_message}
                            </p>
                        </div>
                    )}

                    {/* Signatories Card */}
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "14px",
                            boxShadow:
                                "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                            padding: "20px",
                            marginBottom: "8px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "16px",
                                paddingBottom: "12px",
                                borderBottom: "1px solid #e2e8f0",
                            }}
                        >
                            <span style={{ fontSize: "18px" }}>✍️</span>
                            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                                Signatories
                            </span>
                            <span
                                style={{
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    borderRadius: "20px",
                                    padding: "1px 10px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                {selectedSignatories.length}
                            </span>
                        </div>

                        {selectedSignatories.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "32px 16px",
                                    color: "#94a3b8",
                                }}
                            >
                                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                <div style={{ fontSize: "14px" }}>No signatories added yet.</div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {sortedDepts.map((deptKey, dIdx) => {
                                    const deptSigs = [...grouped[deptKey]].sort((a, b) =>
                                        (a._role || "").localeCompare(b._role || "")
                                    );
                                    const palette = deptColors[dIdx % deptColors.length];

                                    return (
                                        <div
                                            key={deptKey}
                                            style={{
                                                border: `1px solid ${palette.light}`,
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {/* Department header */}
                                            <div
                                                style={{
                                                    background: palette.header,
                                                    padding: "10px 16px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <span style={{ fontSize: "14px" }}>🗂️</span>
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: "13px",
                                                        color: "#fff",
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {deptKey}
                                                </span>
                                                <span
                                                    style={{
                                                        marginLeft: "auto",
                                                        background: "rgba(255,255,255,0.2)",
                                                        color: "#fff",
                                                        borderRadius: "20px",
                                                        padding: "1px 10px",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {deptSigs.length}{" "}
                                                    {deptSigs.length === 1 ? "signatory" : "signatories"}
                                                </span>
                                            </div>

                                            {/* Signatory rows */}
                                            <div style={{ background: "#fff" }}>
                                                {deptSigs.map((sig, sIdx) => {
                                                    const isLast = sIdx === deptSigs.length - 1;
                                                    return (
                                                        <div
                                                            key={sig.id ?? sig.employee_id ?? sIdx}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "12px",
                                                                padding: "12px 16px",
                                                                borderBottom: isLast
                                                                    ? "none"
                                                                    : "1px solid #f1f5f9",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            {/* Avatar */}
                                                            <div
                                                                style={{
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
                                                                }}
                                                            >
                                                                {sig._name.charAt(0).toUpperCase()}
                                                            </div>

                                                            {/* Name + Role */}
                                                            <div style={{ flex: 1, minWidth: "120px" }}>
                                                                <div
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        fontSize: "14px",
                                                                        color: "#1e293b",
                                                                    }}
                                                                >
                                                                    {sig._name}
                                                                </div>
                                                                {sig._role !== "—" && (
                                                                    <div
                                                                        style={{
                                                                            fontSize: "11px",
                                                                            color: "#64748b",
                                                                            marginTop: "2px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                background: palette.light,
                                                                                color: palette.accent,
                                                                                borderRadius: "6px",
                                                                                padding: "1px 7px",
                                                                                fontWeight: 600,
                                                                                fontSize: "10px",
                                                                            }}
                                                                        >
                                                                            {sig._role}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Remarks */}
                                                            <div
                                                                style={{
                                                                    flex: 2,
                                                                    minWidth: "100px",
                                                                    fontSize: "12px",
                                                                    color: "#475569",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize: "9px",
                                                                        fontWeight: 700,
                                                                        color: "#94a3b8",
                                                                        textTransform: "uppercase",
                                                                        letterSpacing: "0.06em",
                                                                        marginBottom: "2px",
                                                                    }}
                                                                >
                                                                    Remarks
                                                                </div>
                                                                <div>{sig._remarks}</div>
                                                            </div>

                                                            {/* Status badge — always "Pending" for a new template */}
                                                            <div
                                                                style={{
                                                                    background: "#fef9c3",
                                                                    color: "#854d0e",
                                                                    border: "1px solid #fde047",
                                                                    borderRadius: "20px",
                                                                    padding: "3px 12px",
                                                                    fontSize: "11px",
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.06em",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                Pending
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="alert alert-danger mt-3">{error}</div>
                    )}
                </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
                    Cancel
                </Button>
                {showConfirmButton && (
                    <Button
                        variant="success"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Creating...
                            </>
                        ) : (
                            "Confirm Template"
                        )}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default TemplatePreviewModal;
