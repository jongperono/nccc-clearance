import { useState, useEffect } from "react";
import { Button, Form, Modal, Row, Col, Spinner } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import ClearanceRequestDetails from "./ClearanceRequestDetails";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";
import TemplatePreviewModal from "./TemplatePreviewModal";

// --- Interfaces ---
interface ClearanceRequest {
    id: number;
    requestId?: string;
    company: string;
    company_id: string;
    name: string;
    email: string;
    branch: string;
    branch_id: string;
    department: string;
    department_id: string;
    purpose: string;
    id_number: string;
    effectivity_date: string;
    position: string;
    immediate_head: string;
    assigned_by?: number | null;
    clearance_status?: string;
}

interface NewClearanceRequest {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    company_id: string;
    branch_id: string;
    department_id: string;
    purpose: string;
    id_number: string;
    effectivity_date: string;
    immediate_head: string;
    position: string;
}

interface TemplateData {
    template_id: number;
    title: string;
    branch_id: number;
    department_id: number;
    company_id: number;
    purpose: string;
    footer_message?: string;
    creator_employee?: {
        first_name: string;
        last_name: string;
        email?: string;
        role_id?: string;
    };
}

interface Company {
    company_id: number | string;
    company_name: string;
}

interface Branch {
    branch_id: number | string;
    branch_name: string;
}

interface Department {
    department_id: number | string;
    department_name: string;
}

const ClearanceRequest: React.FC = () => {
    // --- State ---
    const [requests, setRequests] = useState<ClearanceRequest[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterDepartment, setFilterDepartment] = useState("All");
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [newRequest, setNewRequest] = useState<NewClearanceRequest>({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        company_id: '',
        branch_id: '',
        department_id: '',
        purpose: '',
        id_number: '',
        effectivity_date: '',
        immediate_head: '',
        position: '',
    });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
    const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
    // --- Template Preview Modal State ---
    const [showViewModal, setShowViewModal] = useState(false);
    const [templatePreviewData, setTemplatePreviewData] = useState<{ title: string; purpose: string; footer_message?: string }>({ title: "", purpose: "", footer_message: "" });
    const [selectedSignatories, setSelectedSignatories] = useState<any[]>([]);

    // --- Alert ---
    const { showAlert, AlertComponent } = useCustomAlert();

    // --- Fetch Current Employee ID ---
    useEffect(() => {
        const fetchCurrentEmployee = async () => {
            try {
                const response = await apiRequest<any>("/check-permissions", "GET");
                const perms = response?.data?.data || {};
                setCurrentEmployeeId(perms.employee_id ?? null);
            } catch (error) {
                console.error("Failed to fetch current employee:", error);
            }
        };

        fetchCurrentEmployee();
    }, []);

    // --- Table Columns ---
    const columns: ColumnDefinition<ClearanceRequest>[] = [
        { dataField: "id_number", text: "ID Number", sortable: true },
        { dataField: "name", text: "Name", sortable: true },
        { dataField: "email", text: "Email", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        { dataField: "effectivity_date", text: "Effectivity Date", sortable: true },
        {
            dataField: "id",
            text: "Action",
            formatter: (_cell, row) => {
                const isCleared = (row.clearance_status || "").toLowerCase() === "cleared";
                const isAssignedByMe = currentEmployeeId !== null && row.assigned_by === currentEmployeeId;

                return (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAssignClick(row)}
                        >
                            Assign
                        </Button>
                        {!isCleared && isAssignedByMe && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteClearance(row.id)}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ];

    // --- Filtering ---
    const filterPredicate = (request: ClearanceRequest, searchTerm: string) =>
        (request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.department.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterDepartment === "All" || request.department === filterDepartment);

    // --- Custom Table Buttons ---
    const customButtons = [
        {
            text: "Add Request",
            icon: FaPlusCircle,
            variant: "primary",
            onClick: () => setShowModal(true)
        }
    ];

    // --- Form Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewRequest(prev => ({
            ...prev,
            [name]: value
        }));
        // Remove error if field is filled
        if (validated) {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (value) delete newErrors[name];
                return newErrors;
            });
        }
    };

    // --- Form Validation ---
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!newRequest.first_name) newErrors.first_name = "First name is required";
        if (!newRequest.last_name) newErrors.last_name = "Last name is required";
        if (!newRequest.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(newRequest.email)) newErrors.email = "Email is invalid";
        if (!newRequest.company_id) newErrors.company_id = "Company is required";
        if (!newRequest.branch_id) newErrors.branch_id = "Branch is required";
        if (!newRequest.department_id) newErrors.department_id = "Department is required";
        if (!newRequest.purpose) newErrors.purpose = "Clearance purpose is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit New Request ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidated(true);
        if (validateForm()) {
            try {
                console.log('Submitting data:', newRequest);
                await apiRequest("/clearances", "POST", newRequest);
                fetchRequests();
                setNewRequest({
                    first_name: '',
                    middle_name: '',
                    last_name: '',
                    email: '',
                    company_id: '',
                    branch_id: '',
                    department_id: '',
                    purpose: '',
                    id_number: '',
                    effectivity_date: '',
                    immediate_head: '',
                    position: '',
                });
                setShowModal(false);
                setValidated(false);
                showAlert("success", "Clearance request submitted successfully!");
            } catch (error: any) {
                showAlert("error", error?.message || "Failed to submit clearance request.");
            }
        }
    };

    // --- Assign Template Modal ---
    const handleAssignClick = (request: ClearanceRequest) => {
        setSelectedRequest(request);
        setShowAssignModal(true);
        fetchTemplatesForRequest(request.id);
    };

    // --- Delete Clearance ---
    const handleDeleteClearance = async (clearanceId: number) => {
        if (!window.confirm("Are you sure you want to delete this clearance request? This action cannot be undone.")) {
            return;
        }

        try {
            await apiRequest(`/clearances/${clearanceId}`, "DELETE");
            showAlert("success", "Clearance request deleted successfully.");
            fetchRequests(); // Refresh the list
        } catch (error: any) {
            showAlert(
                "error",
                error?.response?.data?.message || "Failed to delete clearance request."
            );
        }
    };

    // --- View Template Preview ---
    const handleViewTemplate = async (template: TemplateData) => {
        setTemplatePreviewData({
            title: template.title,
            purpose: template.purpose,
            footer_message: template.footer_message
        });
        try {
            const signatoryResponse = await apiRequest(`/template/${template.template_id}/signatories`, "GET") as any;
            if (signatoryResponse?.data?.success) {
                const mappedSignatories = (signatoryResponse.data.data || []).map((sig: any) => ({
                    id: sig.employee_id,
                    full_name: sig.employee
                        ? `${sig.employee.first_name} ${sig.employee.last_name}`
                        : "Unknown",
                    remarks: "",
                }));
                setSelectedSignatories(mappedSignatories);
            } else {
                setSelectedSignatories([]);
            }
        } catch {
            setSelectedSignatories([]);
        }
        setShowViewModal(true);
    };

    // --- Assign Template to Request ---
    const handleAssignTemplate = async (template: TemplateData & { signatory_ids?: number[] }) => {
        if (!selectedRequest) return;

        // If signatory_ids is missing, fetch it from backend
        let signatoryIds = template.signatory_ids;
        if (!signatoryIds || !Array.isArray(signatoryIds)) {
            try {
                const res = await apiRequest<{ data: { success: boolean; data: any[] } }>(
                    `/template/${template.template_id}/signatories`, "GET"
                );
                if (res.data.success && Array.isArray(res.data.data)) {
                    signatoryIds = res.data.data.map((s: any) => s.employee_id);
                }
            } catch {
                showAlert("error", "Failed to fetch template signatories.");
                return;
            }
        }

        // Ensure signatory_ids is present and not empty
        if (!signatoryIds || signatoryIds.length === 0) {
            showAlert("error", "This template has no signatories assigned. Please check the template configuration.");
            return;
        }
        setAssigning(true);
        try {
            await apiRequest(
                `/clearance/${selectedRequest.id}/assign-template`,
                "PUT",
                {
                    template_id: template.template_id,
                    signatory_ids: signatoryIds
                }
            );
            showAlert("success", "Template assigned successfully!");
            fetchRequests();
            setTimeout(() => {
                setShowAssignModal(false);
            }, 1000);
        } catch (error: any) {
            showAlert("error", error?.message || "Failed to assign template.");
        } finally {
            setAssigning(false);
        }
    };

    // --- Fetch Data Helpers ---
    const fetchCompanies = async () => {
        try {
            const res = await apiRequest<{ data: { success: boolean; data: Company[] } }>("/companies", "GET");
            if (res.data.success) setCompanies(res.data.data);
        } catch {
            showAlert("error", "Failed to fetch companies.");
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await apiRequest<{ data: { success: boolean; data: Branch[] } }>("/branches", "GET");
            if (res.data.success) setBranches(res.data.data);
        } catch {
            showAlert("error", "Failed to fetch branches.");
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await apiRequest<{ data: { success: boolean; data: Department[] } }>("/departments", "GET");
            if (res.data.success) setDepartments(res.data.data);
        } catch {
            showAlert("error", "Failed to fetch departments.");
        }
    };

    // --- Fetch Clearance Requests ---
    const fetchRequests = async () => {
        try {
            const response = await apiRequest("/clearances", "GET") as any;
            const responseData = response.data.data;
            // Only show requests without assigner
            const filteredData = Array.isArray(responseData)
                ? responseData.filter((r: any) =>
                    !r.assigner || r.assigner === "null"
                )
                : [];
            // Transform for table
            const transformedData = filteredData.map((r: any) => ({
                ...r,
                requestId: `${r.id}-${r.email}`,
                name: `${r.first_name}${r.middle_name ? ' ' + r.middle_name : ''} ${r.last_name}`,
                company: r.Company?.company_name || r.company_id || "N/A",
                branch: r.Branch?.branch_name || r.branch_id || "N/A",
                department: r.Department?.department_name || r.department_id || "N/A",
                id_number: r.id_number || "N/A",
                effectivity_date: r.effectivity_date || "N/A",
                position: r.position || "N/A",
                immediate_head: r.immediate_head || "N/A",
                assigned_by: r.assigned_by ?? null,
                clearance_status: r.clearance_status || "Pending"
            }));
            setRequests(transformedData);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch Templates for Assignment ---
    const fetchTemplatesForRequest = async (_clearanceRequestId: number) => {
        try {
            const res = await apiRequest<{ data: { success: boolean; data: TemplateData[] } }>(
                `/templates`, "GET"
            );
            if (res.data.success) {
                const sorted = [...res.data.data].sort((a, b) =>
                    a.title.localeCompare(b.title)
                );
                setFilteredTemplates(sorted);
            } else {
                setFilteredTemplates([]);
            }
        } catch {
            setFilteredTemplates([]);
        }
    };

    // --- Initial Data Load ---
    useEffect(() => {
        fetchCompanies();
        fetchBranches();
        fetchDepartments();
        fetchRequests();
    }, []);

    if (loading) return <Spinner animation="border" />;

    // --- Render ---
    return (
        <div className="container-fluid p-2 p-md-4">
            {AlertComponent}
            {/* Template Preview Modal */}
            <TemplatePreviewModal
                show={showViewModal}
                onHide={() => setShowViewModal(false)}
                templateData={templatePreviewData}
                selectedSignatories={selectedSignatories}
                showConfirmButton={false}
            />
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">Clearance Request</h2>
            {/* Requests Table */}
            <DynamicTable<ClearanceRequest>
                data={requests}
                columns={columns}
                keyField="requestId"
                title="Requests"
                customButtons={customButtons}
                striped
                hover
                responsive
                showSearch
                showPagination
                pageSize={10}
                additionalFilters={
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mt-2 mt-sm-0">
                        <label htmlFor="departmentFilter" className="me-2 mb-1 mb-sm-0 small text-muted">Department:</label>
                        <Form.Select
                            id="departmentFilter"
                            className="w-auto"
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                        ></Form.Select>
                    </div>
                }
                filterPredicate={filterPredicate}
            />
            <div className="d-block d-md-none mt-3">
                <p className="text-muted small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Scroll horizontally to view all data
                </p>
            </div>
            {/* Add Request Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Clearance Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        {/* Section: Personal Information */}
                        <div className="border rounded p-3 mb-3 bg-light">
                            <h6 className="text-muted text-uppercase fw-semibold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                Personal Information
                            </h6>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group controlId="firstName">
                                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="first_name"
                                            value={newRequest.first_name}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.first_name}
                                            placeholder="e.g. Juan"
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.first_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group controlId="middleName">
                                        <Form.Label>Middle Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="middle_name"
                                            value={newRequest.middle_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Santos"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group controlId="lastName">
                                        <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="last_name"
                                            value={newRequest.last_name}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.last_name}
                                            placeholder="e.g. Dela Cruz"
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.last_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-0">
                                <Col md={6}>
                                    <Form.Group controlId="idNumber">
                                        <Form.Label>ID Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="id_number"
                                            value={newRequest.id_number}
                                            onChange={handleInputChange}
                                            placeholder="e.g. EMP-00123"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="email">
                                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={newRequest.email}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.email}
                                            placeholder="e.g. juan@example.com"
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Section: Employment Details */}
                        <div className="border rounded p-3 mb-3 bg-light">
                            <h6 className="text-muted text-uppercase fw-semibold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                Employment Details
                            </h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="position">
                                        <Form.Label>Position</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="position"
                                            value={newRequest.position}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Sales Associate"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="immediateHead">
                                        <Form.Label>Immediate Head</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="immediate_head"
                                            value={newRequest.immediate_head}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Maria Reyes"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-0">
                                <Col md={12}>
                                    <Form.Group controlId="company">
                                        <Form.Label>Company <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="company_id"
                                            value={newRequest.company_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.company_id}
                                            required
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map((company, idx) => (
                                                <option key={`${company.company_id}-${idx}`} value={company.company_id}>
                                                    {company.company_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.company_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mt-3 mb-0">
                                <Col md={6}>
                                    <Form.Group controlId="branch">
                                        <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="branch_id"
                                            value={newRequest.branch_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.branch_id}
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((branch, idx) => (
                                                <option key={`${branch.branch_id}-${idx}`} value={branch.branch_id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.branch_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="department">
                                        <Form.Label>Department <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="department_id"
                                            value={newRequest.department_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!errors.department_id}
                                            required
                                            disabled={!newRequest.company_id}
                                        >
                                            <option value="">
                                                {newRequest.company_id ? "Select Department" : "Select Company First"}
                                            </option>
                                            {departments.map((dept, idx) => (
                                                <option key={`${dept.department_id}-${idx}`} value={dept.department_id}>
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.department_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Section: Clearance Details */}
                        <div className="border rounded p-3 mb-3 bg-light">
                            <h6 className="text-muted text-uppercase fw-semibold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                Clearance Details
                            </h6>
                            <Row className="mb-0">
                                <Col md={8}>
                                    <Form.Group controlId="purpose">
                                        <Form.Label>Purpose of Clearance <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="purpose"
                                            value={newRequest.purpose}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Resignation, Transfer, etc."
                                            isInvalid={!!errors.purpose}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.purpose}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group controlId="effectivityDate">
                                        <Form.Label>Effectivity Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="effectivity_date"
                                            value={newRequest.effectivity_date}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Submit
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal.Body>
            </Modal>
            {/* Assign Template Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
                <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", borderBottom: "none" }}>
                    <Modal.Title style={{ color: "#fff", fontWeight: 700, fontSize: "17px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📋</span> Assign Clearance Template
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "#f1f5f9", padding: "20px" }}>
                    {selectedRequest && (
                        <div>
                            {/* Employee Details Card */}
                            <div style={{ marginBottom: "4px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                    <span style={{ fontSize: "15px" }}>👤</span>
                                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee Details</span>
                                </div>
                                <ClearanceRequestDetails
                                    idNumber={selectedRequest.id_number || "N/A"}
                                    companyId={selectedRequest.company_id}
                                    name={selectedRequest.name}
                                    email={selectedRequest.email}
                                    branch={selectedRequest.branch}
                                    department={selectedRequest.department}
                                    company={selectedRequest.company}
                                    purpose={selectedRequest.purpose}
                                    position={selectedRequest.position}
                                    immediateHead={selectedRequest.immediate_head}
                                    effectivityDate={selectedRequest.effectivity_date}
                                />
                            </div>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0 14px" }}>
                                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Templates</span>
                                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                            </div>

                            {/* Templates */}
                            {filteredTemplates.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {filteredTemplates.map((tmpl) => (
                                        <div key={tmpl.template_id} style={{
                                            background: "#fff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "12px",
                                            padding: "14px 16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                            flexWrap: "wrap",
                                        }}>
                                            {/* Icon */}
                                            <div style={{
                                                width: "40px", height: "40px", borderRadius: "10px",
                                                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "20px", flexShrink: 0,
                                            }}>📄</div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: "140px" }}>
                                                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{tmpl.title}</div>
                                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                                    <span style={{
                                                        background: "#f0fdf4", color: "#15803d",
                                                        border: "1px solid #bbf7d0", borderRadius: "6px",
                                                        padding: "1px 8px", fontSize: "11px", fontWeight: 600,
                                                    }}>{tmpl.purpose}</span>
                                                    <span style={{
                                                        background: "#eff6ff", color: "#1d4ed8",
                                                        border: "1px solid #bfdbfe", borderRadius: "6px",
                                                        padding: "1px 8px", fontSize: "11px", fontWeight: 600,
                                                    }}>
                                                        # {tmpl.template_id}
                                                    </span>
                                                    {tmpl.creator_employee && (
                                                        <span style={{
                                                            background: "#faf5ff", color: "#6d28d9",
                                                            border: "1px solid #ddd6fe", borderRadius: "6px",
                                                            padding: "1px 8px", fontSize: "11px", fontWeight: 600,
                                                        }}>
                                                            👤 {tmpl.creator_employee.first_name} {tmpl.creator_employee.last_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleViewTemplate(tmpl)}
                                                    style={{ borderRadius: "8px", fontWeight: 600, fontSize: "12px", padding: "5px 14px" }}
                                                >
                                                    👁 Preview
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleAssignTemplate(tmpl)}
                                                    disabled={assigning}
                                                    style={{ borderRadius: "8px", fontWeight: 600, fontSize: "12px", padding: "5px 14px" }}
                                                >
                                                    {assigning ? <Spinner animation="border" size="sm" /> : "✅ Assign"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", background: "#fff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>No templates available</div>
                                    <div style={{ fontSize: "12px", marginTop: "4px" }}>Create a template first before assigning.</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                    <Button variant="outline-secondary" onClick={() => setShowAssignModal(false)} style={{ borderRadius: "8px" }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ClearanceRequest;