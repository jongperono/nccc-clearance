import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import DynamicTable from "../../utils/DynamicTable";
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
    showConfirmButton?: boolean; // <-- add this prop
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
    show,
    onHide,
    onSuccess,
    templateData,
    selectedSignatories,
    formDataWithIds,
    showConfirmButton = true, // <-- default to true
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

    // Fetch the creator employee's details for the clearance header.
    // Prefer templateData.creator_employee_id (set when viewing an existing template);
    // fall back to the logged-in user's id (used when creating a new template).
    useEffect(() => {
        const employeeId =
            templateData?.creator_employee_id != null
                ? String(templateData.creator_employee_id)
                : localStorage.getItem('employee_id');
        if (!employeeId) return;
        apiRequest<any>(`/employee/${employeeId}`, 'GET')
            .then((res) => {
                const emp = res?.data?.data ?? res?.data ?? res;
                if (emp) {
                    setCreator({
                        id: String(emp.employee_id ?? employeeId),
                        name: emp.full_name
                            || [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ')
                            || '-',
                        company: emp.company_id ?? '-',
                        branch: emp.branch_id ?? '-',
                        department: emp.department_id ?? '-',
                        datePrepared: new Date().toLocaleDateString(),
                    });
                }
            })
            .catch(() => { /* keep defaults on error */ });
    }, [templateData?.creator_employee_id]);

    // Confirm template creation
    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            setError(null);

            const signatoryIds = selectedSignatories.map((sig: any) => sig.id || sig.employee_id);

            const payloadSource = formDataWithIds || templateData;
            const templatePayload = {
                title: payloadSource.title,
                purpose: payloadSource.purpose,
                footer_message: payloadSource.footer_message || "",
                signatories: signatoryIds
            };

            const response: any = await apiRequest("/template", "POST", templatePayload);
            console.log("Template created successfully:", payloadSource);
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

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Template Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex align-items-center bg-light shadow-sm border rounded mb-4 p-3">
                    <img src={ncccLogo} alt="NCCC Logo" className="img-fluid" width="150" />
                    <div className="flex-grow-1 text-center">
                        <h4 className="mb-0">{templateData?.title || "Untitled Template"}</h4>
                    </div>
                </div>

                <div className="mb-4 p-3 border rounded shadow-sm bg-light">
                    <div className="row justify-content-center">
                        <div className="col-md-5 text-start">
                            <p className="mb-0"><strong>Employee ID no:</strong> {creator.id}</p>
                            <p className="mb-0"><strong>Name:</strong> {creator.name}</p>
                            <p className="mb-0"><strong>Clearance Purpose:</strong> {templateData?.purpose || "N/A"}</p>
                        </div>
                        <div className="col-md-5 text-start">
                            <p className="mb-0"><strong>Company:</strong> {creator.company}</p>
                            <p className="mb-0"><strong>Branch:</strong> {creator.branch}</p>
                            <p className="mb-0"><strong>Department:</strong> {creator.department}</p>
                        </div>
                    </div>
                    <div className="text-center mt-3">
                        <p className="mb-0"><strong>Date prepared:</strong> {creator.datePrepared}</p>
                    </div>
                    {templateData?.footer_message && (
                        <div className="text-center mt-3">
                            <p className="text-muted mb-0">{templateData.footer_message}</p>
                        </div>
                    )}
                </div>

                <DynamicTable
                    data={
                        (selectedSignatories as any[]).map(sig => ({
                            ...sig,
                            remarks: "ok", // dummy value
                            status: "pending" // dummy value
                        }))
                    }
                    title="Signatories"
                    columns={[
                        { dataField: "full_name", text: "Signatory", sortable: false },
                        { dataField: "remarks", text: "Remarks", sortable: false },
                        { dataField: "status", text: "Status", sortable: false }, // new column
                    ]}
                    keyField="id"
                    striped
                    bordered
                    responsive
                    showSearch={false}
                    showPagination={false}
                />

                {error && (
                    <div className="alert alert-danger mt-3">
                        {error}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
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
