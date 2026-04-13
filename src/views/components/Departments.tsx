import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import { apiRequest } from "../../utils/ApiService";

// Department interface for department data
interface Department {
    id?: string;
    department_id: string;
    department_name: string;
    description: string;
}

// API response type
interface ApiResponse<T> {
    data: {
        status: number;
        success: boolean;
        message: string;
        data: T;
    };
}

const DepartmentManagement: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<Department>({
        department_id: '',
        department_name: '',
        description: ''
    });

    // Fetch departments from backend
    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiRequest<ApiResponse<Department[]>>("/departments", "GET");
            if (response.data.success && response.data.data) {
                setDepartments(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch departments');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Add department
    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const response = await apiRequest<ApiResponse<Department>>(
                "/department", 
                "POST", 
                formData
            );
            
            if (response.data.success) {
                fetchDepartments();
                setShowModal(false);
            } else {
                setError(response.data.message || 'Failed to add department');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit department
    const handleEditDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        if (editingDepartment) {
            try {
                const response = await apiRequest<ApiResponse<Department>>(
                    `/department/${editingDepartment.department_id}`, 
                    "PUT", 
                    {
                        department_name: formData.department_name,
                        description: formData.description,
                    }
                );
                
                if (response.data.success) {
                    fetchDepartments();
                    setShowModal(false);
                    setEditingDepartment(null);
                } else {
                    setError(response.data.message || 'Failed to update department');
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setSubmitting(false);
            }
        }
    };

    // Delete department
    const handleDeleteDepartment = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this department?")) {
            try {
                setError(null);
                const response = await apiRequest<ApiResponse<null>>(`/department/${id}`, "DELETE");
                
                if (response.data.success) {
                    fetchDepartments();
                } else {
                    setError(response.data.message || 'Failed to delete department');
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            }
        }
    };

    // Show add modal
    const handleShowAddModal = () => {
        setEditingDepartment(null);
        setFormData({
            department_id: '',
            department_name: '',
            description: ''
        });
        setShowModal(true);
    };

    // Show edit modal
    const handleShowEditModal = (department: Department) => {
        setEditingDepartment(department);
        setFormData({
            department_id: department.department_id,
            department_name: department.department_name,
            description: department.description
        });
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingDepartment(null);
        setSubmitting(false);
    };

    // Table columns
    const columns: ColumnDefinition<Department>[] = [
        {
            dataField: "department_id",
            text: "Department ID",
            sortable: true,
        },
        {
            dataField: "department_name",
            text: "Department Name",
            sortable: true,
        },
        {
            dataField: "description",
            text: "Description",
            sortable: false,
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_cell: string, row: Department) => (
                <>
                    <Button
                        variant="warning"
                        size="sm"
                        className="text-black"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShowEditModal(row);
                        }}
                        title="Edit"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDepartment(row.department_id);
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

    // Custom action buttons
    const customButtons = [
        {
            text: (
                <>
                    <FaPlusCircle className="me-2" />
                    Add Department
                </>
            ),
            icon: undefined,
            variant: "primary",
            onClick: handleShowAddModal,
        },
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">NCCC Departments</h2>
            
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            
            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <DynamicTable<Department>
                    data={departments}
                    columns={columns}
                    keyField="department_id"
                    title="Departments"
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

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingDepartment ? "Edit Department" : "Add Department"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={editingDepartment ? handleEditDepartment : handleAddDepartment}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Department ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleInputChange}
                                required
                                disabled={!!editingDepartment}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Department Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="department_name"
                                value={formData.department_name}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={submitting || !formData.department_name.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    {editingDepartment ? 'Saving...' : 'Adding...'}
                                </>
                            ) : (
                                editingDepartment ? 'Save Changes' : 'Add Department'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default DepartmentManagement;
