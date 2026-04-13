import { Button, Form, Modal, Row, Col, Spinner } from "react-bootstrap";
import React, { useState, useEffect } from "react";
// Add import for react-icons
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Import necessary interfaces
interface Employee {
    id?: number;
    employee_id: string | number;
    full_name?: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    phone_number: string | number;
    email: string;
    password: string;
    role_id: string;
    branch_id: string;
    department_id: string;
    company_id: string;
    is_signatory: boolean;
    can_assign_clearances: boolean;
    can_create_templates: boolean;
    can_create_accounts: boolean;
    can_access_logs: boolean;
    can_access_all_clearances: boolean;
    can_create_clearance_requests: boolean;
    can_clear_clearances: boolean;
    can_create_roles: boolean;
    can_create_companies: boolean;
    can_create_departments: boolean;
    can_create_branches: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

interface Role {
    role_id: string;
    role_name: string;
    description?: string;
}

interface Branch {
    branch_id: string;
    branch_name: string;
    description?: string;
}

interface Department {
    department_id: string;
    department_name: string;
    description?: string;
}

// Company interface
interface Company {
    company_id: string;
    company_name: string;
}

interface EmployeeModalProps {
    show: boolean;
    onHide: () => void;
    employee: Omit<Employee, 'id' | 'full_name'>;
    loading: {[key: string]: boolean};
    roles: Role[];
    branches: Branch[];
    departments: Department[];
    companies: Company[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAddEmployee: () => void;
    isEditing?: boolean;
    companySelected: boolean;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
    show,
    onHide,
    employee,
    loading,
    roles = [],
    branches = [],
    departments = [],
    companies = [],
    handleInputChange,
    handleCheckboxChange,
    handleAddEmployee,
    isEditing = false,
    companySelected
}) => {
    // State for validation
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    // Add state for password visibility
    const [showPassword, setShowPassword] = useState(false);
    
    // Reset validation state when modal is opened/closed
    useEffect(() => {
        if (show) {
            setValidated(false);
            setErrors({});
        }
    }, [show]);

    // Validate the form fields
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        // Required fields validation
        if (!employee.employee_id) newErrors.employee_id = "Employee ID is required";
        if (!employee.first_name) newErrors.first_name = "First name is required";
        if (!employee.last_name) newErrors.last_name = "Last name is required";
        if (!employee.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(String(employee.email))) {
            newErrors.email = "Email is invalid";
        }
        if (!employee.phone_number) newErrors.phone_number = "Phone number is required";
        if (!employee.role_id) newErrors.role_id = "Role is required";
        if (!employee.branch_id) newErrors.branch_id = "Branch is required";
        if (!employee.department_id) newErrors.department_id = "Department is required";
        if (!employee.company_id) newErrors.company_id = "Company is required"; // Add this line
        // Password validation removed as it's now optional
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handler for form submission
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        
        setValidated(true);
        if (validateForm()) {
            handleAddEmployee();
        }
    };

    // Field-level validation handler
    const handleFieldValidation = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Update the employee data first (using the existing handler)
        handleInputChange(e);
        
        // Then validate the specific field
        if (validated) {
            setErrors(prev => {
                const newErrors = { ...prev };
                
                // Clear error if value is now valid
                if (value) {
                    delete newErrors[name];
                } 
                // Add specific error messages based on field
                else if (!value) {
                    newErrors[name] = `${name.replace('_', ' ')} is required`;
                }
                
                // Special validation for email
                if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
                    newErrors.email = "Email is invalid";
                }
                
                return newErrors;
            });
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Edit Employee' : 'Add Employee'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group controlId="employeeId">
                                <Form.Label>Employee ID: <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    name="employee_id"
                                    value={employee.employee_id}
                                    onChange={handleFieldValidation}
                                    placeholder="Enter ID"
                                    isInvalid={validated && !!errors.employee_id}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.employee_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group controlId="firstName">
                                <Form.Label>First Name: <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="first_name"
                                    value={employee.first_name}
                                    onChange={handleFieldValidation}
                                    placeholder="Enter First Name"
                                    isInvalid={validated && !!errors.first_name}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.first_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="middleName">
                                <Form.Label>Middle Name:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="middle_name"
                                    value={employee.middle_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter Middle Name"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="lastName">
                                <Form.Label>Last Name: <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="last_name"
                                    value={employee.last_name}
                                    onChange={handleFieldValidation}
                                    placeholder="Enter Last Name"
                                    isInvalid={validated && !!errors.last_name}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.last_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="email">
                                <Form.Label>Email: <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={employee.email}
                                    onChange={handleFieldValidation}
                                    placeholder="Enter email"
                                    isInvalid={validated && !!errors.email}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="phone">
                                <Form.Label>Phone Number: <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    name="phone_number"
                                    value={employee.phone_number}
                                    onChange={handleFieldValidation}
                                    placeholder="Enter Phone No."
                                    isInvalid={validated && !!errors.phone_number}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone_number}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="password">
                                <Form.Label>Password:</Form.Label>
                                <div className="position-relative">
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={employee.password || ''}
                                        onChange={handleFieldValidation}
                                        placeholder="Enter Password (Optional)"
                                        isInvalid={validated && !!errors.password}
                                    />
                                    <Button 
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="position-absolute end-0 top-0 h-100 d-flex align-items-center justify-content-center"
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        type="button"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="company">
                                <Form.Label>Company: <span className="text-danger">*</span></Form.Label>
                                {loading.companies ? (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : (
                                    <Form.Select
                                        name="company_id"
                                        value={employee.company_id}
                                        onChange={handleFieldValidation}
                                        isInvalid={validated && !!errors.company_id}
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {Array.isArray(companies) && companies.map(company => (
                                            <option key={company.company_id} value={company.company_id}>
                                                {company.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                                <Form.Control.Feedback type="invalid">
                                    {errors.company_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group controlId="role">
                                <Form.Label>Role: <span className="text-danger">*</span></Form.Label>
                                {loading.roles ? (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : (
                                    <Form.Select
                                        name="role_id"
                                        value={employee.role_id}
                                        onChange={handleFieldValidation}
                                        isInvalid={validated && !!errors.role_id}
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(role => (
                                            <option key={role.role_id} value={role.role_id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                                <Form.Control.Feedback type="invalid">
                                    {errors.role_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="branch">
                                <Form.Label>Branch: <span className="text-danger">*</span></Form.Label>
                                {loading.branches ? (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : (
                                    <Form.Select
                                        name="branch_id"
                                        value={employee.branch_id}
                                        onChange={handleFieldValidation}
                                        isInvalid={validated && !!errors.branch_id}
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.branch_id} value={branch.branch_id}>
                                                {branch.branch_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                                <Form.Control.Feedback type="invalid">
                                    {errors.branch_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="department">
                                <Form.Label>Department: <span className="text-danger">*</span></Form.Label>
                                {loading.departments ? (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : (
                                    <Form.Select
                                        name="department_id"
                                        value={employee.department_id}
                                        onChange={handleFieldValidation}
                                        isInvalid={validated && !!errors.department_id}
                                        required
                                        disabled={!companySelected}
                                    >
                                        <option value="">
                                            {companySelected ? "Select Department" : "Select Company First"}
                                        </option>
                                        {departments.map(dept => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.department_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                                {!companySelected && !loading.departments && (
                                    <small className="text-muted">Please select a company first</small>
                                )}
                                <Form.Control.Feedback type="invalid">
                                    {errors.department_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Separation line before Signatory */}
                    <hr className="my-4" />

                    <Row className="mb-3">
                        <Col md={12}>
                            {/* Signatory Toggle Button */}
                            <div className="d-flex justify-content-center mb-4">
                                <Button
                                    variant={employee.is_signatory ? "success" : "outline-secondary"}
                                    onClick={() =>
                                        handleCheckboxChange({
                                            target: {
                                                name: "is_signatory",
                                                checked: !employee.is_signatory,
                                                type: "checkbox" // <-- Ensure type is set for synthetic event
                                            }
                                        } as React.ChangeEvent<HTMLInputElement>)
                                    }
                                    style={{
                                        minWidth: 180,
                                        fontWeight: 600,
                                        borderWidth: 2,
                                        borderColor: employee.is_signatory ? "#198754" : "#6c757d",
                                    }}
                                    type="button"
                                >
                                    {employee.is_signatory ? "Signatory: Yes" : "Signatory: No"}
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {/* Separation line before Permissions */}
                    <hr className="my-4" />

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold mb-2">Permissions:</Form.Label>
                        <Row className="g-3">
                            <Col xs={12}>
                                <div className="fw-semibold text-primary mb-1 mt-2">Clearance Permissions</div>
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_assign_clearances"
                                    label="Assign clearances" 
                                    name="can_assign_clearances"
                                    checked={!!employee.can_assign_clearances}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_clear_clearances"
                                    label="Clear clearances" 
                                    name="can_clear_clearances"
                                    checked={!!employee.can_clear_clearances}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_clearance_requests"
                                    label="Create clearance requests" 
                                    name="can_create_clearance_requests"
                                    checked={!!employee.can_create_clearance_requests}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_access_all_clearances"
                                    label="Access all clearances" 
                                    name="can_access_all_clearances"
                                    checked={!!employee.can_access_all_clearances}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12}>
                                <div className="fw-semibold text-primary mb-1 mt-3">Account & Template Management</div>
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_templates"
                                    label="Create templates" 
                                    name="can_create_templates"
                                    checked={!!employee.can_create_templates}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_accounts"
                                    label="Create accounts" 
                                    name="can_create_accounts"
                                    checked={!!employee.can_create_accounts}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_roles"
                                    label="Create roles" 
                                    name="can_create_roles"
                                    checked={!!employee.can_create_roles}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_companies"
                                    label="Create companies" 
                                    name="can_create_companies"
                                    checked={!!employee.can_create_companies}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_departments"
                                    label="Create departments" 
                                    name="can_create_departments"
                                    checked={!!employee.can_create_departments}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_create_branches"
                                    label="Create branches" 
                                    name="can_create_branches"
                                    checked={!!employee.can_create_branches}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                            <Col xs={12}>
                                <div className="fw-semibold text-primary mb-1 mt-3">Other Permissions</div>
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                                <Form.Check 
                                    type="checkbox" 
                                    id="can_access_logs"
                                    label="Access logs" 
                                    name="can_access_logs"
                                    checked={!!employee.can_access_logs}
                                    onChange={handleCheckboxChange}
                                />
                            </Col>
                        </Row>
                    </Form.Group>
                    
                    <div className="mt-4 text-muted small">
                        <span className="text-danger">*</span> Required fields
                    </div>
                    
                    <Modal.Footer className="px-0 pb-0">
                        <Button variant="secondary" onClick={onHide}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update' : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EmployeeModal;
// No changes needed in this file. Update your parent component's handleCheckboxChange as described.
