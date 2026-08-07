import React from 'react';

// Clearance request details display component — updated
interface ClearanceRequestDetailsProps {
    idNumber: string;
    companyId?: string;
    name: string;
    email: string;
    branch: string;
    department: string;
    company?: string;
    effectivityDate?: string;
    purpose: string;
    position?: string;
    immediateHead?: string;
    status?: "Pending" | "In Progress" | "Approved" | "Cleared";
}

const InfoItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
    }}>
        <span style={{ fontSize: "15px", minWidth: "20px", marginTop: "1px" }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b", wordBreak: "break-word" }}>{value || "—"}</div>
        </div>
    </div>
);

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
    "Pending": { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
    "In Progress": { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" },
    "Approved": { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    "Cleared": { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
};

const ClearanceRequestDetails: React.FC<ClearanceRequestDetailsProps> = ({
    idNumber,
    name,
    email,
    branch,
    department,
    company = "NCCC",
    effectivityDate,
    purpose,
    position,
    immediateHead,
    status,
}) => {
    const sv = status ? statusStyles[status] : null;

    return (
        <div style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "4px",
        }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: "16px", flexShrink: 0,
                    }}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>{name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{email}</div>
                    </div>
                </div>
                {sv && (
                    <div style={{
                        background: sv.bg, color: sv.color, border: `1.5px solid ${sv.border}`,
                        borderRadius: "20px", padding: "4px 14px",
                        fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                        {status}
                    </div>
                )}
            </div>

            {/* Fields grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                <InfoItem icon="🪪" label="ID Number" value={idNumber} />
                <InfoItem icon="🏙️" label="Company" value={company} />
                <InfoItem icon="📍" label="Branch" value={branch} />
                <InfoItem icon="🗂️" label="Department" value={department} />
                <InfoItem icon="💼" label="Position" value={position || "—"} />
                <InfoItem icon="👔" label="Immediate Head" value={immediateHead || "—"} />
                <InfoItem icon="🎯" label="Purpose" value={purpose} />
                <InfoItem icon="📅" label="Effectivity Date" value={effectivityDate || "—"} />
            </div>
        </div>
    );
};

export default ClearanceRequestDetails;
