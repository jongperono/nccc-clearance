import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";

interface ClearanceEditModalProps {
    show: boolean;
    onHide: () => void;
    clearanceId: number | null;
    onUpdated?: () => void;
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

interface ClearanceData {
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

const ClearanceEditModal: React.FC<ClearanceEditModalProps> = ({
    show,
    onHide,
    clearanceId,
    onUpdated
}) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState<ClearanceData>({
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

    const { showAlert, AlertComponent } = useCustomAlert();

    // Fetch clearance details
    useEffect(() => {
        if (!show || !clearanceId) return;

        const fetchClearance = async () => {
            setLoading(true);
            try {
                const response = await apiRequest(`/clearance/${clearanceId}/details`, "GET") as any;
                const clearance = response?.data?.data?.clearance || response?.data?.clearance;

                if (clearance) {
                    setFormData({
                        first_name: clearance.first_name || '',
                        middle_name: clearance.middle_name || '',
                        last_name: clearance.last_name || '',
                        email: clearance.email || '',
                        company_id: String(clearance.company_id || ''),
                        branch_id: String(clearance.branch_id || ''),
                        department_id: String(clearance.department_id || ''),
                        purpose: clearance.purpose || '',
                        id_number: clearance.id_number || '',
                        effectivity_date: clearance.effectivity_date ? clearance.effectivity_date.split('T')[0] : '',
                        immediate_head: clearance.immediate_head || '',
                        position: clearance.position || '',
                    });
                }
            } catch (error: any) {
                showAlert('error', error?.message || 'Failed to load clearance details');
            } finally {
                setLoading(false);
            }
        };

        fetchClearance();
    }, [show, clearanceId]);

    // Fetch companies, branches, departments
    useEffect(() => {
        if (!show) return;

        const fetchData = async () => {
            try {
                const [companiesRes, branchesRes, departmentsRes] = await Promise.all([
                    apiRequest<any>('/companies', 'GET'),
                    apiRequest<any>('/branches', 'GET'),
                    apiRequest<any>('/departments', 'GET'),
                ]);

                setCompanies(companiesRes?.data?.data || companiesRes?.data || []);
                setBranches(branchesRes?.data?.data || branchesRes?.data || []);
                setDepartments(departmentsRes?.data?.data || departmentsRes?.data || []);
            } catch (error) {
                console.error('Failed to fetch dropdown data:', error);
            }
        };

        fetchData();
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }

        console.log('[ClearanceEditModal] Submitting clearance update:', {
            clearanceId,
            formData
        });

        setSubmitting(true);
        try {
            const response = await apiRequest(`/clearance/${clearanceId}`, 'PUT', formData);
            console.log('[ClearanceEditModal] Update response:', response);
            showAlert('success', 'Clearance updated successfully!');

            if (onUpdated) {
                onUpdated();
            }

            setTimeout(() => {
                onHide();
                setValidated(false);
            }, 1500);
        } catch (error: any) {
            console.error('[ClearanceEditModal] Update error:', error);
            showAlert('error', error?.message || 'Failed to update clearance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setValidated(false);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" scrollable centered>
            <Modal.Header closeButton style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                borderBottom: "none",
                padding: "16px 20px",
            }}>
                <Modal.Title style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}>
                    <span>✏️</span>
                    <span>Edit Clearance</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ background: "#f1f5f9", padding: "20px" }}>
                {AlertComponent}

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted">Loading clearance details...</div>
                    </div>
                ) : (
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <div style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}>
                            <h6 style={{
                                fontWeight: 700,
                                marginBottom: "16px",
                                color: "#1e293b",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}>
                                <span>👤</span> Personal Information
                            </h6>

                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please provide a first name.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Middle Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="middle_name"
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please provide a last name.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please provide a valid email.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>ID Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="id_number"
                                            value={formData.id_number}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Position</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Immediate Head</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="immediate_head"
                                            value={formData.immediate_head}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}>
                            <h6 style={{
                                fontWeight: 700,
                                marginBottom: "16px",
                                color: "#1e293b",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}>
                                <span>🏢</span> Organization Details
                            </h6>

                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Company <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="company_id"
                                            value={formData.company_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map((company) => (
                                                <option key={company.company_id} value={company.company_id}>
                                                    {company.company_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            Please select a company.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="branch_id"
                                            value={formData.branch_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.branch_id} value={branch.branch_id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            Please select a branch.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Department <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="department_id"
                                            value={formData.department_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.department_id} value={dept.department_id}>
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            Please select a department.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}>
                            <h6 style={{
                                fontWeight: 700,
                                marginBottom: "16px",
                                color: "#1e293b",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}>
                                <span>📋</span> Clearance Details
                            </h6>

                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Purpose <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="purpose"
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please provide a purpose.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Effectivity Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="effectivity_date"
                                            value={formData.effectivity_date}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={submitting}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ClearanceEditModal;
