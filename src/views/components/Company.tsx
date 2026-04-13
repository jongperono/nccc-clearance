import { useEffect, useState } from "react";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";

interface Company extends Record<string, unknown> {
    company_id: string;
    company_name: string;
    departments?: string[];
}

interface Department extends Record<string, unknown> {
    department_id: string;
    department_name: string;
    description?: string;
}

const CompanyTable = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const { showAlert, AlertComponent } = useCustomAlert();
    const [newCompany, setNewCompany] = useState<Partial<Company>>({
        company_id: "",
        company_name: "",
        departments: [],
    });
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await apiRequest("/companies", "GET");
            if (res.data.success) setCompanies(res.data.data);
        } catch {
            showAlert("error", "Failed to fetch companies.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await apiRequest("/departments", "GET");
            if (res.data.success) setDepartments(res.data.data);
        } catch {
            showAlert("error", "Failed to fetch departments.");
        }
    };

    useEffect(() => {
        fetchCompanies();
        fetchDepartments();
    }, []);

    const toggleDepartment = (deptId: string) => {
        setNewCompany(prev => ({
            ...prev,
            departments: prev.departments?.includes(deptId)
                ? prev.departments.filter(id => id !== deptId)
                : [...(prev.departments || []), deptId]
        }));
    };

    const fetchCompanyDepartments = async (companyId: string) => {
        try {
            const res = await apiRequest(`/company/${companyId}/departments`, "GET");
            return res.data.success
                ? res.data.data.map((d: Department) => d.department_id)
                : [];
        } catch {
            showAlert("error", "Failed to fetch company departments.");
            return [];
        }
    };

    const handleEdit = async (company: Company) => {
        try {
            const departmentIds = await fetchCompanyDepartments(company.company_id);
            setNewCompany({ ...company, departments: departmentIds });
            setIsEditing(true);
            setShowModal(true);
        } catch {
            showAlert("error", "Failed to prepare company for editing.");
        }
    };

    const handleAddOrUpdateCompany = async () => {
        if (!newCompany.company_id || !newCompany.company_name) {
            showAlert("error", "Both ID and Name are required.");
            return;
        }
        try {
            setSubmitting(true);
            if (isEditing) {
                await apiRequest(`/company/${newCompany.company_id}`, "PUT", {
                    company_name: newCompany.company_name,
                    department_ids: newCompany.departments,
                });
                showAlert("success", "Company updated successfully!");
            } else {
                await apiRequest("/company", "POST", {
                    company_id: newCompany.company_id,
                    company_name: newCompany.company_name,
                    department_ids: newCompany.departments,
                });
                showAlert("success", "Company added successfully!");
            }
            fetchCompanies();
            setShowModal(false);
            setNewCompany({ company_id: "", company_name: "", departments: [] });
            setIsEditing(false);
        } catch {
            showAlert("error", isEditing ? "Failed to update company." : "Failed to add company.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCompany = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                const res = await apiRequest(`/company/${id}`, "DELETE");
                if (res.data.success) {
                    showAlert("success", "Company deleted successfully!");
                    await fetchCompanies();
                } else {
                    showAlert("error", res.data.message || "Failed to delete company.");
                }
            } catch (error: any) {
                showAlert("error", error.response?.data?.message || "Failed to delete company.");
            }
        }
    };

    const columns: ColumnDefinition<Company>[] = [
        { dataField: "company_id", text: "Company ID", sortable: true },
        { dataField: "company_name", text: "Company Name", sortable: true },
        {
            dataField: "actions" as keyof Company,
            text: "Actions",
            formatter: (_cell, row) => (
                <>
                    <Button
                        variant="warning"
                        size="sm"
                        className="text-black"
                        onClick={e => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        title="Edit"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            handleDeleteCompany(row.company_id);
                        }}
                        title="Delete"
                        className="ms-2"
                    >
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    const customButtons = [
        {
            text: (
                <>
                    <FaPlusCircle className="me-2" />
                    Add Company
                </>
            ),            
            icon: undefined,
            variant: "primary",
            onClick: () => {
                setNewCompany({ company_id: "", company_name: "", departments: [] });
                setShowModal(true);
            },
        },
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">Companies</h2>
            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <DynamicTable<Company>
                    data={companies}
                    columns={columns}
                    keyField="company_id"
                    title="Companies"
                    customButtons={customButtons}
                    striped
                    hover
                    responsive
                    showSearch
                    showPagination
                    pageSize={10}
                    tableClasses="table-sm table-md"
                    containerClasses="overflow-auto"
                />
            )}
            {/* Responsive helper text visible only on small devices */}
            <div className="d-block d-md-none mt-3">
                <p className="text-muted small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Scroll horizontally to view all data
                </p>
            </div>
            <Modal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setNewCompany({ company_id: "", company_name: "", departments: [] });
                }}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Edit Company" : "Add Company"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Company ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter company ID"
                                value={newCompany.company_id}
                                onChange={e => setNewCompany({ ...newCompany, company_id: e.target.value })}
                                disabled={isEditing || submitting}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Company Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter company name"
                                value={newCompany.company_name}
                                onChange={e => setNewCompany({ ...newCompany, company_name: e.target.value })}
                                disabled={submitting}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <DynamicTable<Department>
                                data={departments}
                                columns={[
                                    { dataField: "department_name", text: "Department Name" },
                                    { dataField: "description", text: "Description" },
                                    {
                                        dataField: "department_id" as keyof Department, // Use department_id for actions column key
                                        text: "Select",
                                        formatter: (_cell, row) => (
                                            <Form.Check
                                                type="checkbox"
                                                checked={newCompany.departments?.includes(row.department_id) || false}
                                                onChange={() => toggleDepartment(row.department_id)}
                                                disabled={submitting}
                                            />
                                        ),
                                    },
                                ]}
                                keyField="department_id"
                                title="Departments"
                                striped
                                hover
                                responsive
                                showSearch
                                showPagination={false}
                                filterPredicate={(item, searchTerm) =>
                                    item.department_name.toLowerCase().includes(searchTerm.toLowerCase())
                                }
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowModal(false);
                            setIsEditing(false);
                            setNewCompany({ company_id: "", company_name: "", departments: [] });
                        }}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddOrUpdateCompany}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : isEditing ? "Update" : "Save"}
                    </Button>
                </Modal.Footer>
            </Modal>
            {AlertComponent}
        </div>
    );
};

export default CompanyTable;
