import { useState, useEffect } from 'react';
import { Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaPlusCircle } from 'react-icons/fa';
import DynamicTable, {ColumnDefinition} from '../../utils/DynamicTable';
import { apiRequest } from '../../utils/ApiService';

// Role interface for role management
interface Role {
    id?: number;  // Optional for new roles
    role_id: string;
    role_name: string;
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

const RoleManagement: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<Role>({
        role_id: '',
        role_name: '',
        description: ''
    });

    // Fetch all roles on mount
    useEffect(() => {
        fetchRoles();
    }, []);

    // Fetch roles from API
    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiRequest<ApiResponse<Role[]>>('/roles', 'GET');
            if (response.data.success && response.data.data) {
                setRoles(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch roles');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Show add modal
    const handleShowAddModal = () => {
        setIsEditing(false);
        setFormData({
            role_id: '',
            role_name: '',
            description: ''
        });
        setShowModal(true);
    };

    // Show edit modal
    const handleShowEditModal = (role: Role) => {
        setIsEditing(true);
        setCurrentRole(role);
        setFormData({
            role_id: role.role_id,
            role_name: role.role_name,
            description: role.description
        });
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentRole(null);
        setSubmitting(false);
    };

    // Submit add/edit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            if (isEditing && currentRole) {
                // Update existing role via API
                const response = await apiRequest<ApiResponse<Role>>(
                    `/role/${currentRole.role_id}`, 
                    'PUT', 
                    { 
                        role_name: formData.role_name,
                        description: formData.description
                    }
                );
                
                if (response.data.success) {
                    // Update local state
                    fetchRoles(); // Refresh roles from server
                } else {
                    setError(response.data.message);
                }
            } else {
                // Add new role via API
                const response = await apiRequest<ApiResponse<Role>>(
                    '/role', 
                    'POST', 
                    formData
                );
                
                if (response.data.success) {
                    // Refresh roles from server
                    fetchRoles();
                } else {
                    setError(response.data.message);
                }
            }
            
            handleCloseModal();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            setSubmitting(false);
        }
    };

    // Delete role
    const handleDelete = async (roleId: string) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                setError(null);
                const response = await apiRequest<ApiResponse<null>>(`/role/${roleId}`, 'DELETE');
                
                if (response.data.success) {
                    // Update local state by removing the deleted role
                    fetchRoles(); // Refresh roles from server
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            }
        }
    };

    // Table columns
    const columns: ColumnDefinition<Role>[] = [
        {
            dataField: 'role_id',
            text: 'Role ID',
            sortable: true
        },
        {
            dataField: 'role_name',
            text: 'Role Name',
            sortable: true
        },
        {
            dataField: 'description',
            text: 'Description',
            sortable: true
        },
        {
            dataField: 'actions',
            text: 'Actions',
            formatter: (_cell: any, row: Role) => (
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
                            handleDelete(row.role_id);
                        }}
                        title="Delete"
                        className="ms-2"
                    >
                        Delete
                    </Button>
                </>
            )
        }
    ];

    // Custom action buttons
    const customButtons = [
        {
            text: (
                <>
                    <FaPlusCircle className="me-2" />
                    Add Role
                </>
            ),
            icon: undefined,
            variant: "primary",
            onClick: handleShowAddModal
        }
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">NCCC Employee Roles</h2>
            
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            
            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <DynamicTable<Role>
                    data={roles}
                    columns={columns}
                    keyField="role_id"
                    title="Roles"
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
                    <Modal.Title>{isEditing ? 'Edit Role' : 'Add New Role'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Role ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleInputChange}
                                required
                                disabled={isEditing} // Disable editing role_id for existing roles
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Role Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="role_name"
                                value={formData.role_name}
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
                            Close
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    {isEditing ? 'Saving...' : 'Adding...'}
                                </>
                            ) : (
                                isEditing ? 'Save Changes' : 'Add Role'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManagement;