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
    company: string;
    company_id: string;
    name: string;
    email: string;
    branch: string;
    branch_id: string;
    department: string;
    department_id: string;
    purpose: string;
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
}

interface TemplateData {
    template_id: number;
    title: string;
    branch_id: number;
    department_id: number;
    company_id: number;
    purpose: string;
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
        purpose: ''
    });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
    const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    // --- Template Preview Modal State ---
    const [showViewModal, setShowViewModal] = useState(false);
    const [templatePreviewData, setTemplatePreviewData] = useState<{ title: string; purpose: string; footer_message?: string }>({ title: "", purpose: "", footer_message: "" });
    const [selectedSignatories, setSelectedSignatories] = useState<any[]>([]);

    // --- Alert ---
    const { showAlert, AlertComponent } = useCustomAlert();

    // --- Table Columns ---
    const columns: ColumnDefinition<ClearanceRequest>[] = [
        { dataField: "id", text: "ID", sortable: true },
        { dataField: "name", text: "Name", sortable: true },
        { dataField: "email", text: "Email", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        { dataField: "purpose", text: "Purpose", sortable: true },
        {
            dataField: "id",
            text: "Action",
            formatter: (_cell: number, row: ClearanceRequest) => (
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAssignClick(row)}
                >
                    Assign
                </Button>
            )
        }
    ];

    const templateColumns: ColumnDefinition<TemplateData>[] = [
        { dataField: "title", text: "Title", sortable: true },
        { dataField: "purpose", text: "Purpose", sortable: true },
        {
            dataField: "template_id",
            text: "Actions",
            headerStyle: { width: '160px' },
            formatter: (_cell: number, row: TemplateData) => (
                <>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewTemplate(row)}
                        className="ms-2"
                    >
                        View
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAssignTemplate(row)}
                        disabled={assigning}
                        className="ms-2"
                    >
                        {assigning ? <Spinner animation="border" size="sm" /> : "Assign"}
                    </Button>
                </>
            )
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
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                    purpose: ''
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

    // --- View Template Preview ---
    const handleViewTemplate = async (template: TemplateData) => {
        setTemplatePreviewData({
            title: template.title,
            purpose: template.purpose,
            footer_message: template.footer_message
        });
        try {
            const signatoryResponse = await apiRequest(`/template/${template.template_id}/signatories`, "GET");
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
            const response = await apiRequest("/clearances", "GET");
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
                name: `${r.first_name} ${r.last_name}`,
                company: r.company_id || "N/A",
                branch: r.branch_id || "N/A",
                department: r.department_id || "N/A",
                purpose: r.purpose || "N/A",
            }));
            setRequests(transformedData);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch Templates for Assignment ---
    const fetchTemplatesForRequest = async (clearanceRequestId: number) => {
        try {
            const res = await apiRequest<{ data: { success: boolean; data: TemplateData[] } }>(
                `/templates`, "GET"
            );
            if (res.data.success) {
                setTemplates(res.data.data);
                setFilteredTemplates(res.data.data);
            } else {
                setTemplates([]);
                setFilteredTemplates([]);
            }
        } catch {
            setTemplates([]);
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
                classes={{
                    table: 'table-sm',
                    header: 'py-2',
                    row: 'align-middle'
                }}
                style={{
                    cell: { padding: '0.4rem 0.6rem' }
                }}
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
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.last_name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={newRequest.email}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.email}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
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
                        <Row className="mb-3">
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
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group controlId="purpose">
                                    <Form.Label>Purpose of Clearance Request <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="purpose"
                                        value={newRequest.purpose}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Resignation, Transfer, etc."
                                        isInvalid={!!errors.purpose}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.purpose}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
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
                <Modal.Header closeButton className="py-2">
                    <Modal.Title className="fs-5">Assign Clearance Template</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3">
                    {selectedRequest && (
                        <div>
                            <h5 className="mb-3">Employee Details</h5>
                            <ClearanceRequestDetails
                                id={selectedRequest.id}
                                company={selectedRequest.company_id}
                                name={selectedRequest.name}
                                email={selectedRequest.email}
                                branch={selectedRequest.branch_id}
                                department={selectedRequest.department_id}
                                purpose={selectedRequest.purpose}
                            />
                            <hr />
                            {filteredTemplates.length > 0 ? (
                                <DynamicTable<TemplateData>
                                    data={filteredTemplates}
                                    columns={[
                                        { dataField: "title", text: "Title", sortable: true },
                                        { dataField: "purpose", text: "Purpose", sortable: true },
                                        {
                                            dataField: "template_id",
                                            text: "Actions",
                                            headerStyle: { width: '160px' },
                                            formatter: (_cell: number, row: TemplateData) => (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleViewTemplate(row)}
                                                        className="ms-2"
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleAssignTemplate(row)}
                                                        disabled={assigning}
                                                        className="ms-2"
                                                    >
                                                        {assigning ? <Spinner animation="border" size="sm" /> : "Assign"}
                                                    </Button>
                                                </>
                                            )
                                        }
                                    ]}
                                    keyField="template_id"
                                    striped
                                    hover
                                    responsive
                                    title="Available Templates"
                                    classes={{
                                        table: 'table-sm',
                                        header: 'py-2',
                                        row: 'align-middle'
                                    }}
                                    style={{
                                        cell: { padding: '0.4rem 0.6rem' }
                                    }}
                                />
                            ) : (
                                <p>No templates available.</p>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ClearanceRequest;
