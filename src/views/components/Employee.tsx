import { useState, useEffect } from "react";
import { Button, Form, Spinner, Modal } from "react-bootstrap";
import { FaEye, FaEdit, FaPlusCircle } from "react-icons/fa";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import EmployeeModal from "./EmployeeModal";
import EmployeeViewModal from "./EmployeeViewModal";
import { Employee, Role, Branch, Department, Company, ApiResponse } from "../../types/interfaces";

// Employee table for managing employees
const EmployeeTable = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState<{[key: string]: boolean}>({  
        employees: false,
        roles: false,
        branches: false,
        departments: false,
        companies: false
    });
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [resetPasswordEmployee, setResetPasswordEmployee] = useState<Employee | null>(null);
    const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id' | 'full_name'>>({
        employee_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        phone_number: "",
        email: "",
        department_id: "",
        role_id: "",
        branch_id: "",
        company_id: "",
        is_signatory: false,
        can_assign_clearances: false,
        can_create_templates: false,
        can_create_accounts: false,
        can_access_logs: false,
        can_create_roles: false,
        can_create_companies: false,
        can_create_departments: false,
        can_create_branches: false,
        can_create_clearance_requests: false,
        can_clear_clearances: false, // renamed from can_approve_clearances
    });
    const { showAlert, AlertComponent } = useCustomAlert();

    useEffect(() => {
        fetchEmployees();
        fetchRoles();
        fetchBranches();
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchDepartments(selectedCompanyId);
        } else {
            setDepartments([]);
        }
    }, [selectedCompanyId]);

    // Fetch employees from API
    const fetchEmployees = async () => {
        try {
            setLoading(prev => ({ ...prev, employees: true }));
            const response = await apiRequest<{ data: ApiResponse<Employee[]> }>("/employees", "GET");
            setEmployees(response.data.data);
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to fetch employees.");
        } finally {
            setLoading(prev => ({ ...prev, employees: false }));
        }
    };

    // Fetch roles from API
    const fetchRoles = async () => {
        try {
            setLoading(prev => ({ ...prev, roles: true }));
            const response = await apiRequest<{ data: ApiResponse<Role[]> }>("/roles", "GET");
            if (response.data.success && response.data.data) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to fetch roles.");
        } finally {
            setLoading(prev => ({ ...prev, roles: false }));
        }
    };

    // Fetch branches from API
    const fetchBranches = async () => {
        try {
            setLoading(prev => ({ ...prev, branches: true }));
            const response = await apiRequest<{ data: ApiResponse<Branch[]> }>("/branches", "GET");
            if (response.data.success && response.data.data) {
                setBranches(response.data.data);
            }
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to fetch branches.");
        } finally {
            setLoading(prev => ({ ...prev, branches: false }));
        }
    };

    // Fetch departments for a company
    const fetchDepartments = async (companyId: string) => {
        try {
            setLoading(prev => ({ ...prev, departments: true }));
            const response = await apiRequest<{ data: ApiResponse<Department[]> }>(
                `/company/${companyId}/departments`, 
                "GET"
            );
            if (response.data.success && response.data.data) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to fetch departments.");
            setDepartments([]);
        } finally {
            setLoading(prev => ({ ...prev, departments: false }));
        }
    };

    // Fetch companies from API
    const fetchCompanies = async () => {
        try {
            setLoading(prev => ({ ...prev, companies: true }));
            const response = await apiRequest<{ data: ApiResponse<Company[]> }>("/companies", "GET");
            if (response.data.success && response.data.data) {
                setCompanies(response.data.data);
            }
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to fetch companies.");
        } finally {
            setLoading(prev => ({ ...prev, companies: false }));
        }
    };

    // Close modal
    const handleClose = () => {
        setShowModal(false);
        setIsEditing(false);
        setNewEmployee({
            employee_id: "",
            first_name: "",
            middle_name: "",
            last_name: "",
            phone_number: "",
            email: "",
            department_id: "",
            role_id: "",
            branch_id: "",
            company_id: "",
            is_signatory: false,
            can_assign_clearances: false,
            can_create_templates: false,
            can_create_accounts: false,
            can_access_logs: false,
            can_create_roles: false,
            can_create_companies: false,
            can_create_departments: false,
            can_create_branches: false,
            can_access_all_clearances: false,
            can_create_clearance_requests: false,
            can_clear_clearances: false, // renamed from can_approve_clearances
        });
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'company_id') {
            setSelectedCompanyId(value);
            setNewEmployee({
                ...newEmployee,
                company_id: value,
                department_id: ""
            });
        } else {
            setNewEmployee({
                ...newEmployee,
                [name]: value
            });
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setNewEmployee(prev => ({ ...prev, [name]: checked }));
    };

    // Add employee
    const handleAddEmployee = async () => {
        try {
            await apiRequest("/employee", "POST", newEmployee);
            showAlert("success", "Employee added successfully!");
            handleClose();
            const response = await apiRequest<{ data: ApiResponse<Employee[]> }>("/employees", "GET");
            setEmployees(response.data.data);
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to add employee.");
        }
    };

    // Edit employee
    const handleEditEmployee = async () => {
        try {
            await apiRequest(`/employee/${newEmployee.employee_id}`, "PUT", newEmployee);
            showAlert("success", "Employee updated successfully!");
            handleClose();
            const response = await apiRequest<{ data: ApiResponse<Employee[]> }>("/employees", "GET");
            setEmployees(response.data.data);
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to update employee.");
        }
    };

    // Set employee for editing
    const handleEdit = (employee: Employee) => {
        setNewEmployee({
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            middle_name: employee.middle_name,
            last_name: employee.last_name,
            phone_number: employee.phone_number,
            email: employee.email,
            department_id: employee.department_id,
            role_id: employee.role_id,
            branch_id: employee.branch_id,
            company_id: employee.company_id,
            is_signatory: employee.is_signatory,
            can_assign_clearances: employee.can_assign_clearances,
            can_create_templates: employee.can_create_templates,
            can_create_accounts: employee.can_create_accounts,
            can_access_logs: employee.can_access_logs,
            can_create_roles: employee.can_create_roles,
            can_create_companies: employee.can_create_companies,
            can_create_departments: employee.can_create_departments,
            can_create_branches: employee.can_create_branches,
            can_access_all_clearances: employee.can_access_all_clearances,
            can_create_clearance_requests: employee.can_create_clearance_requests,
            can_clear_clearances: employee.can_clear_clearances, // renamed from can_approve_clearances
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleView = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowViewModal(true);
    };

    const handleResetPassword = (employee: Employee) => {
        setResetPasswordEmployee(employee);
        setGeneratedPassword(null);
        setShowResetPasswordModal(true);
    };

    const handleConfirmResetPassword = async () => {
        if (!resetPasswordEmployee) return;
        try {
            setResetPasswordLoading(true);
            const response = await apiRequest<any>(`/employee/${resetPasswordEmployee.employee_id}/reset-password`, "PUT");
            const newPassword = response?.data?.data?.generated_password;
            setGeneratedPassword(newPassword);
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to reset password.");
            setShowResetPasswordModal(false);
        } finally {
            setResetPasswordLoading(false);
        }
    };

    const handleCloseResetPasswordModal = () => {
        setShowResetPasswordModal(false);
        setResetPasswordEmployee(null);
        setGeneratedPassword(null);
        if (generatedPassword) {
            showAlert("success", "Password reset successfully!");
        }
    };

    const columns: ColumnDefinition<Employee>[] = [
        {
            dataField: "employee_id",
            text: "Employee ID",
            sortable: true
        },
        {
            dataField: "full_name",
            text: "Full Name",
            sortable: true
        },
        {
            dataField: "phone_number",
            text: "Phone Number",
            sortable: true
        },
        {
            dataField: "email",
            text: "Email",
            sortable: true
        },
        {
            dataField: "company_id",
            text: "Company",
            sortable: true,
            formatter: (cell, _row) => {
                const companyId = typeof cell === "string" ? cell : "";
                const company = companies.find(c => c.company_id === companyId);
                return company ? company.company_name : "N/A";
            }
        },
        {
            dataField: "department_id",
            text: "Department",
            sortable: true,
            formatter: (cell: string | number | boolean | null | undefined, _row: Employee) => {
                const departmentId = typeof cell === "string" ? cell : "";
                const department = departments.find(d => d.department_id === departmentId);
                return department ? department.department_name : departmentId;
            }
        },
        {
            dataField: "role_id",
            text: "Role",
            sortable: true,
            formatter: (cell: string | number | boolean | null | undefined, _row: Employee) => {
                const roleId = typeof cell === "string" ? cell : "";
                const role = roles.find(r => r.role_id === roleId);
                return role ? role.role_name : roleId;
            }
        },
        {
            dataField: "id",
            text: "Actions",
            formatter: (_cell: string | number | boolean | null | undefined, row: Employee) => (
                <>
                    <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleView(row)}
                        title="View"
                        className="ms-2"
                    >
                        View
                    </Button>
                    <Button 
                        variant="warning" 
                        size="sm" 
                        onClick={() => handleEdit(row)}
                        title="Edit"
                        className="ms-2"
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleResetPassword(row)}
                        title="Reset Password"
                        className="ms-2"
                    >
                        Reset Password
                    </Button>
                </>
            )
        }
    ];

    const customButtons = [
        {
            text: (
                <>
                    <FaPlusCircle className="me-2" />
                    Add Employee
                </>
            ),
            icon: undefined,
            variant: "primary",
            onClick: () => {
                setIsEditing(false);
                setShowModal(true);
            }
        }
    ];

    const departmentOptions = [
        { value: "All", label: "All Departments" },
        ...departments.map(dept => ({ 
            value: dept.department_id, 
            label: dept.department_name 
        }))
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">NCCC Employees</h2>
            
            <DynamicTable<Employee>
                data={employees}
                columns={columns}
                keyField="employee_id"
                title="Employees"
                customButtons={customButtons}
                striped
                hover
                responsive
                showSearch
                showPagination
                pageSize={10}
                tableClasses="table-sm table-md"
                containerClasses="overflow-auto"
                additionalFilters={
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mt-2 mt-sm-0">
                        <label htmlFor="departmentFilter" className="me-2 mb-1 mb-sm-0 small text-muted">Department:</label>
                        <Form.Select
                            id="departmentFilter" 
                            value={departmentFilter} 
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="form-select-sm"
                            style={{ width: '180px' }}
                        >
                            {departmentOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                }
                filterPredicate={(employee, searchTerm) => {
                    if (departmentFilter !== "All" && employee.department_id !== departmentFilter) {
                        return false;
                    }
                    
                    const search = searchTerm.toLowerCase();          
                    return (
                        String(employee.employee_id).toLowerCase().includes(search) ||
                        employee.full_name.toLowerCase().includes(search) ||
                        employee.first_name.toLowerCase().includes(search) ||
                        employee.last_name.toLowerCase().includes(search) ||
                        (employee.middle_name && employee.middle_name.toLowerCase().includes(search)) ||
                        String(employee.phone_number).toLowerCase().includes(search) ||
                        employee.email.toLowerCase().includes(search) ||
                        String(employee.role_id).toLowerCase().includes(search) ||
                        String(employee.branch_id).toLowerCase().includes(search) ||
                        String(employee.department_id).toLowerCase().includes(search) ||
                        String(employee.company_id).toLowerCase().includes(search)
                    );
                }}
            />

            {/* Responsive helper text visible only on small devices */}
            <div className="d-block d-md-none mt-3">
                <p className="text-muted small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Scroll horizontally to view all data
                </p>
            </div>

            <EmployeeModal
                show={showModal}
                onHide={handleClose}
                employee={newEmployee}
                loading={loading}
                roles={roles}
                branches={branches}
                departments={departments}
                companies={companies}
                handleInputChange={handleInputChange}
                handleCheckboxChange={handleCheckboxChange}
                handleAddEmployee={isEditing ? handleEditEmployee : handleAddEmployee}
                isEditing={isEditing}
                companySelected={!!selectedCompanyId}
            />

            <EmployeeViewModal
                show={showViewModal}
                onHide={() => setShowViewModal(false)}
                employee={selectedEmployee}
                roles={roles}
                branches={branches}
                departments={departments}
                companies={companies}
            />

            {/* Password Reset Modal */}
            <Modal show={showResetPasswordModal} onHide={handleCloseResetPasswordModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!generatedPassword ? (
                        <div>
                            <p>Are you sure you want to reset the password for:</p>
                            <p className="fw-bold text-primary">{resetPasswordEmployee?.full_name}</p>
                            <p className="text-muted small">A new password will be generated and displayed.</p>
                        </div>
                    ) : (
                        <div className="alert alert-success">
                            <h6 className="alert-heading">Password Reset Successfully!</h6>
                            <Form.Group>
                                <Form.Label className="mb-1">New Password</Form.Label>
                                <div className="d-flex gap-2 align-items-center">
                                    <Form.Control
                                        type="text"
                                        readOnly
                                        value={generatedPassword || ""}
                                        className="bg-white"
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => {
                                            if (generatedPassword) {
                                                navigator.clipboard.writeText(generatedPassword);
                                                showAlert("success", "Password copied to clipboard.");
                                            }
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </Form.Group>
                            <p className="mt-2 mb-0 small text-muted">Please share this password with the employee. They can change it after logging in.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!generatedPassword ? (
                        <>
                            <Button variant="secondary" onClick={handleCloseResetPasswordModal}>
                                Cancel
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleConfirmResetPassword}
                                disabled={resetPasswordLoading}
                            >
                                {resetPasswordLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Resetting...</> : 'Reset Password'}
                            </Button>
                        </>
                    ) : (
                        <Button variant="success" onClick={handleCloseResetPasswordModal}>
                            Done
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {AlertComponent}
        </div>
    );
};

export default EmployeeTable;