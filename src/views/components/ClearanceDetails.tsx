import React, { useEffect, useState } from "react";
import { Modal, Spinner, Button } from "react-bootstrap";
import DynamicTable from "../../utils/DynamicTable";
import ncccLogo from "../../assets/nccc_logo.webp";
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

    useEffect(() => {
        if (!show) return;
        setLoading(true);
        setError(null);

        const fetchDetails = async () => {
            try {
                const clearanceRes = await apiRequest(`/clearance/${clearanceId}/details`, "GET");
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

        fetchDetails();
    }, [show, clearanceId]);

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Clearance Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : clearance ? (
                    <>
                        <div className="d-flex align-items-center bg-light shadow-sm border rounded mb-4 p-3">
                            <img src={ncccLogo} alt="NCCC Logo" className="img-fluid" width="150" />
                            <div className="flex-grow-1 text-center">
                                <h4 className="mb-0">Clearance</h4>
                            </div>
                        </div>
                        <div className="mb-4 p-3 border rounded shadow-sm bg-light">
                            <div className="row justify-content-center">
                                <div className="col-md-5 text-start">
                                    <p className="mb-0"><strong>Employee ID no:</strong> {clearance.id}</p>
                                    <p className="mb-0"><strong>Name:</strong> {clearance.full_name || [clearance.first_name, clearance.middle_name, clearance.last_name].filter(Boolean).join(" ")}</p>
                                    <p className="mb-0"><strong>Clearance Purpose:</strong> {clearance.purpose || "N/A"}</p>
                                    <p className="mb-0"><strong>Email:</strong> {clearance.email || "-"}</p>
                                </div>
                                <div className="col-md-5 text-start">
                                    <p className="mb-0"><strong>Company:</strong> {clearance.Company?.name || clearance.company_id || "-"}</p>
                                    <p className="mb-0"><strong>Branch:</strong> {clearance.Branch?.name || clearance.branch_id || "-"}</p>
                                    <p className="mb-0"><strong>Department:</strong> {clearance.Department?.name || clearance.department_id || "-"}</p>
                                    <p className="mb-0"><strong>Assigner:</strong> {clearance.assigner?.full_name || "-"}</p>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <p className="mb-0"><strong>Date prepared:</strong> {clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString() : "-"}</p>
                                <p className="mb-0"><strong>Status:</strong> {clearance.clearance_status || "-"}</p>
                            </div>
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
                            title="Signatories"
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
                    </>
                ) : (
                    <div>No clearance data found.</div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ClearanceDetails;
