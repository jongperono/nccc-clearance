import React, { useState } from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { Employee, Role, Branch, Department, Company } from '../../types/interfaces';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Modal for viewing employee details
interface EmployeeViewModalProps {
    show: boolean;
    onHide: () => void;
    employee: Employee | null;
    roles: Role[];
    branches: Branch[];
    departments: Department[];
    companies: Company[];
}

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
    show,
    onHide,
    employee,
    roles,
    branches,
    departments,
    companies
}) => {
    const [showPassword, setShowPassword] = useState(false);
    if (!employee) return null;

    // Format date values
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPP p');
        } catch (e) {
            return dateString;
        }
    };

    // Get display names from IDs
    const getRoleName = (id: string) => {
        const role = roles.find(r => r.role_id === id);
        return role ? role.role_name : id;
    };
    const getBranchName = (id: string) => {
        const branch = branches.find(b => b.branch_id === id);
        return branch ? branch.branch_name : id;
    };
    const getDepartmentName = (id: string) => {
        const dept = departments.find(d => d.department_id === id);
        return dept ? dept.department_name : id;
    };
    const getCompanyName = (id: string) => {
        const company = companies.find(c => c.company_id === id);
        return company ? company.company_name : id;
    };
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    Employee Details: <span className="text-primary">{employee.full_name}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="row mb-4">
                    <div className="col-md-6">
                        <h5 className="border-bottom pb-2 mb-3">Personal Information</h5>
                        <Table borderless size="sm">
                            <tbody>
                                <tr>
                                    <td className="fw-bold text-muted" width="40%">Employee ID:</td>
                                    <td>{employee.employee_id}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">First Name:</td>
                                    <td>{employee.first_name}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Middle Name:</td>
                                    <td>{employee.middle_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Last Name:</td>
                                    <td>{employee.last_name}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Phone Number:</td>
                                    <td>{employee.phone_number}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Email:</td>
                                    <td>{employee.email}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                    
                    <div className="col-md-6">
                        <h5 className="border-bottom pb-2 mb-3">Organization Details</h5>
                        <Table borderless size="sm">
                            <tbody>
                                <tr>
                                    <td className="fw-bold text-muted" width="40%">Department:</td>
                                    <td>{getDepartmentName(employee.department_id.toString())}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Role:</td>
                                    <td>{getRoleName(employee.role_id.toString())}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Branch:</td>
                                    <td>{getBranchName(employee.branch_id.toString())}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Company:</td>
                                    <td>{getCompanyName(employee.company_id)}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Account Creator:</td>
                                    <td>{employee.account_creator || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Generated Password:</td>
                                    <td>
                                        {employee.generated_password ? (
                                            <div className="d-flex align-items-between gap-2">
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={togglePasswordVisibility}
                                                    className="btn-icon btn-info"
                                                >
                                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                </Button>
                                                <span className="me-2">
                                                    {showPassword ? employee.generated_password : '••••••••'}
                                                </span>
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <h5 className="border-bottom pb-2 mb-3">Permissions</h5>
                        {/* Grouped permission badges for clarity */}
                        <div className="mb-2 fw-semibold text-primary">Clearance Permissions</div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Badge bg={employee.can_assign_clearances ? "primary" : "danger"}>
                                {employee.can_assign_clearances ? "Assign clearances" : "Cannot assign clearances"}
                            </Badge>
                            <Badge bg={employee.can_clear_clearances ? "primary" : "danger"}>
                                {employee.can_clear_clearances ? "Clear clearances" : "Cannot clear clearances"}
                            </Badge>
                            <Badge bg={employee.can_create_clearance_requests ? "primary" : "danger"}>
                                {employee.can_create_clearance_requests ? "Create clearance requests" : "Cannot create clearance requests"}
                            </Badge>
                            <Badge bg={employee.can_access_all_clearances ? "primary" : "danger"}>
                                {employee.can_access_all_clearances ? "Access all clearances" : "Cannot access all clearances"}
                            </Badge>
                        </div>
                        <div className="mb-2 fw-semibold text-primary">Account & Template Management</div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Badge bg={employee.can_create_templates ? "primary" : "danger"}>
                                {employee.can_create_templates ? "Create templates" : "Cannot create templates"}
                            </Badge>
                            <Badge bg={employee.can_create_accounts ? "primary" : "danger"}>
                                {employee.can_create_accounts ? "Create accounts" : "Cannot create accounts"}
                            </Badge>
                            <Badge bg={employee.can_create_roles ? "primary" : "danger"}>
                                {employee.can_create_roles ? "Create roles" : "Cannot create roles"}
                            </Badge>
                            <Badge bg={employee.can_create_companies ? "primary" : "danger"}>
                                {employee.can_create_companies ? "Create companies" : "Cannot create companies"}
                            </Badge>
                            <Badge bg={employee.can_create_departments ? "primary" : "danger"}>
                                {employee.can_create_departments ? "Create departments" : "Cannot create departments"}
                            </Badge>
                            <Badge bg={employee.can_create_branches ? "primary" : "danger"}>
                                {employee.can_create_branches ? "Create branches" : "Cannot create branches"}
                            </Badge>
                        </div>
                        <div className="mb-2 fw-semibold text-primary">Other Permissions</div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Badge bg={employee.can_access_logs ? "primary" : "danger"}>
                                {employee.can_access_logs ? "Access logs" : "Cannot access logs"}
                            </Badge>
                        </div>
                        <div className="mb-2 fw-semibold text-primary">Signatory</div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Badge bg={employee.is_signatory ? "primary" : "danger"}>
                                {employee.is_signatory ? "Signatory" : "Not a signatory"}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <h5 className="border-bottom pb-2 mb-3">Timestamps</h5>
                        <Table borderless size="sm">
                            <tbody>
                                <tr>
                                    <td className="fw-bold text-muted" width="40%">Created:</td>
                                    <td>{formatDate(employee.createdAt)}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Last Updated:</td>
                                    <td>{formatDate(employee.updatedAt)}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-muted">Deleted:</td>
                                    <td>{employee.deletedAt ? formatDate(employee.deletedAt) : 'N/A'}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeViewModal;
