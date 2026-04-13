import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ncccLogo from "../../assets/nccc_logo.webp";
import { FaPrint } from "react-icons/fa";
import { apiRequest } from "../../utils/ApiService";

interface RemarkEntry {
    id?: number;
    clearance_id: number;
    employee_id: number;
    remark: string;
    createdAt?: string;
}

const ClearanceTrackingDetails: React.FC = () => {
    const { trackingId } = useParams<{ trackingId: string }>();
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

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" role="status" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger text-center">{error}</div>
            </div>
        );
    }

    if (!data) return null;

    const { clearance, signatories } = data;

    return (
        <div className="container py-4">
            {/* PRINT STYLES */}
            <style>{`
                @media print {
                    html, body { height: auto !important; background: #fff !important; }
                    @page { size: A4 portrait; margin: 1.5cm; }
                    .d-print-none, .modal, .modal-backdrop { display: none !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .table { font-size: 12px !important; width: 100% !important; }
                    th, td { padding: 6px 8px !important; }
                    .table-responsive { overflow: visible !important; }
                }
            `}</style>

            {/* HEADER */}
            <div className="d-flex align-items-center bg-light shadow-sm border rounded mb-4 p-3">
                <img src={ncccLogo} alt="NCCC Logo" className="img-fluid" width="150" />
                <div className="flex-grow-1 text-center">
                    <h4 className="mb-0">Clearance</h4>
                </div>
            </div>

            {/* CLEARANCE DETAILS */}
            <div className="mb-4 p-3 border rounded shadow-sm bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="col-md-6 d-flex flex-column align-items-center text-start">
                        <p className="mb-0"><strong>Employee ID no:</strong> {clearance.id || "-"}</p>
                        <p className="mb-0"><strong>Name:</strong> {clearance.full_name || [clearance.first_name, clearance.middle_name, clearance.last_name].filter(Boolean).join(" ")}</p>
                        <p className="mb-0"><strong>Clearance Purpose:</strong> {clearance.purpose || "N/A"}</p>
                        <p className="mb-0"><strong>Email:</strong> {clearance.email || "-"}</p>
                    </div>
                    <div className="col-md-6 d-flex flex-column align-items-center text-start">
                        <p className="mb-0"><strong>Company:</strong> {clearance.company || clearance.Company?.name || clearance.company_id || "-"}</p>
                        <p className="mb-0"><strong>Branch:</strong> {clearance.branch || clearance.Branch?.name || clearance.branch_id || "-"}</p>
                        <p className="mb-0"><strong>Department:</strong> {clearance.department || clearance.Department?.name || clearance.department_id || "-"}</p>
                        <p className="mb-0"><strong>Tracking ID:</strong> {clearance.tracking_id || "-"}</p>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="mb-0"><strong>Date prepared:</strong> {clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString() : "-"}</p>
                    <p className="mb-0"><strong>Status:</strong> {clearance.clearance_status || "-"}</p>
                </div>
            </div>

            {/* SIGNATORIES TABLE */}
            <div className="mb-4">
                <h5 className="fw-bold mb-3">Signatories</h5>
                <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Signatory</th>
                                <th>Company</th>
                                <th>Branch</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Date Approved</th>
                            </tr>
                        </thead>
                        <tbody>
                            {signatories.map((s: any, idx: number) => (
                                <tr key={idx}>
                                    <td>
                                        {s.Employee
                                            ? [s.Employee.first_name, s.Employee.middle_name, s.Employee.last_name].filter(Boolean).join(" ")
                                            : "-"}
                                    </td>
                                    <td>{s.Employee?.company_id || "-"}</td>
                                    <td>{s.Employee?.branch_id || "-"}</td>
                                    <td>{s.Employee?.department_id || "-"}</td>
                                    <td>
                                        {typeof s.status !== "undefined"
                                            ? s.status
                                            : s.is_approved === true
                                                ? <span className="text-success fw-bold">Approved</span>
                                                : <span className="text-warning fw-bold">Pending</span>
                                        }
                                    </td>
                                    <td>{s.date_approved ? new Date(s.date_approved).toLocaleString() : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REMARKS SECTION */}
            <div className="mb-4">
                <h5 className="fw-bold mb-3">Remarks</h5>
                {remarks.length === 0 ? (
                    <p className="text-muted">No remarks yet.</p>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {remarks.map((r, idx) => (
                            <div
                                key={r.id ?? idx}
                                className="p-3 border rounded bg-light shadow-sm"
                            >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fw-semibold text-primary" style={{ fontSize: "0.85rem" }}>
                                        {(r as any).Employee?.full_name
                                            || [(r as any).Employee?.first_name, (r as any).Employee?.middle_name, (r as any).Employee?.last_name].filter(Boolean).join(" ")
                                            || `Employee #${r.employee_id}`}
                                    </span>
                                    {r.createdAt && (
                                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                            {new Date(r.createdAt).toLocaleString()}
                                        </small>
                                    )}
                                </div>
                                <div>{r.remark}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PRINT BUTTON */}
            <div className="d-flex justify-content-end mt-3 d-print-none">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <FaPrint className="me-2" /> Print
                </button>
            </div>
        </div>
    );
};

export default ClearanceTrackingDetails;
