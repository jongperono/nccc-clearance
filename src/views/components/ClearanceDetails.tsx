import React, { useEffect, useState } from "react";
import { Modal, Spinner, Button, Form, ListGroup, InputGroup } from "react-bootstrap";
import { useCustomAlert } from "../../utils/CustomAlert";
import DynamicTable from "../../utils/DynamicTable";
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
    const { showAlert, AlertComponent } = useCustomAlert();

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

        fetchPermissions();
        fetchDetails();
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

    const getStatusVariant = (status: string) => {
        const s = (status || "").toLowerCase();
        if (s === "approved" || s === "cleared") return { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" };
        if (s === "pending") return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
        if (s === "rejected" || s === "cancelled") return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
        return { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" };
    };

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
                <Modal.Title style={{ color: "#fff", fontWeight: 700, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>📋</span> Clearance Details
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
                                <DynamicTable
                                    data={signatories.map(sig => ({
                                        ...sig.Employee,
                                        remarks: sig.remarks || "-",
                                        status: typeof sig.status !== "undefined"
                                            ? sig.status
                                            : (sig.is_approved === true ? "Approved" : "Pending"),
                                        company_id: sig.Employee?.company_id || "-",
                                        branch_id: sig.Employee?.branch_id || "-",
                                        department_id: sig.Employee?.department_id || "-",
                                    }))}
                                    title=""
                                    columns={[
                                        { dataField: "full_name", text: "Signatory", sortable: false },
                                        { dataField: "company_id", text: "Company", sortable: false },
                                        { dataField: "branch_id", text: "Branch", sortable: false },
                                        { dataField: "department_id", text: "Department", sortable: false },
                                        { dataField: "remarks", text: "Remarks", sortable: false },
                                        { dataField: "status", text: "Status", sortable: false },
                                    ]}
                                    keyField="employee_id"
                                    striped
                                    bordered
                                    responsive
                                    showSearch={false}
                                    showPagination={false}
                                />
                            </div>

                        </div>{/* end cards container */}

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
                                            showAlert('success', 'Signatory added successfully');
                                            setShowAddModal(false);
                                            const res = await apiRequest(`/clearance/${clearanceId}/details`, 'GET') as any;
                                            const apiData = res?.data?.data || res?.data;
                                            setClearance(apiData.clearance);
                                            setSignatories(apiData.signatories || []);
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
                    </>
                ) : (
                    <div className="text-center py-5 text-muted">No clearance data found.</div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ClearanceDetails;
