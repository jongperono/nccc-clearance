import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import { apiRequest } from "../../utils/ApiService";

// Branch interface for branch data
interface Branch {
    branch_id: string;
    branch_name: string;
    location: string;
    contact_number: number;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
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

const Branches: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [newBranch, setNewBranch] = useState<Omit<Branch, 'createdAt' | 'updatedAt' | 'deletedAt'>>({
        branch_id: "",
        branch_name: "",
        location: "",
        contact_number: 0
    });
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch all branches on mount
    useEffect(() => {
        fetchBranches();
    }, []);

    // Fetch branches from API
    const fetchBranches = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiRequest<ApiResponse<Branch[]>>('/branches', 'GET');
            if (response.data.success && response.data.data) {
                setBranches(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch branches');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Add a new branch
    const handleAddBranch = async () => {
        if (newBranch.branch_id && newBranch.branch_name && newBranch.location) {
            try {
                setSubmitting(true);
                const response = await apiRequest<ApiResponse<Branch>>(
                    '/branch',
                    'POST',
                    newBranch
                );

                if (response.data.success) {
                    await fetchBranches(); // Refresh branches from server
                    setNewBranch({ branch_id: "", branch_name: "", location: "", contact_number: 0 });
                    setShowModal(false);
                } else {
                    setError(response.data.message || 'Failed to add branch');
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setSubmitting(false);
            }
        } else {
            alert("Please fill all required fields");
        }
    };

    // Delete a branch
    const handleDeleteBranch = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this branch?")) {
            try {
                setError(null);
                const response = await apiRequest<ApiResponse<null>>(`/branch/${id}`, 'DELETE');

                if (response.data.success) {
                    await fetchBranches(); // Refresh branches from server
                } else {
                    setError(response.data.message || 'Failed to delete branch');
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            }
        }
    };

    // Set branch for editing
    const handleEditBranch = (branch: Branch) => {
        setEditingBranch(branch);
        setNewBranch({
            branch_id: branch.branch_id,
            branch_name: branch.branch_name,
            location: branch.location,
            contact_number: branch.contact_number
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // Update branch
    const handleUpdateBranch = async () => {
        if (editingBranch) {
            try {
                setSubmitting(true);
                const response = await apiRequest<ApiResponse<Branch>>(
                    `/branch/${editingBranch.branch_id}`,
                    'PUT',
                    {
                        branch_id: newBranch.branch_id,
                        branch_name: newBranch.branch_name,
                        location: newBranch.location,
                        contact_number: newBranch.contact_number
                    }
                );

                if (response.data.success) {
                    await fetchBranches(); // Refresh branches from server
                    setShowModal(false);
                    setEditingBranch(null);
                    setIsEditing(false);
                    setNewBranch({ branch_id: "", branch_name: "", location: "", contact_number: 0 });
                } else {
                    setError(response.data.message || 'Failed to update branch');
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setSubmitting(false);
            }
        } else {
            alert("Cannot update branch: no branch selected");
        }
    };

    // Table columns
    const columns: ColumnDefinition<Branch>[] = [
        {
            dataField: "branch_id",
            text: "Branch ID",
            sortable: true
        },
        {
            dataField: "branch_name",
            text: "Branch Name",
            sortable: true
        },
        {
            dataField: "location",
            text: "Location",
            sortable: true
        },
        {
            dataField: "contact_number",
            text: "Contact Number",
            sortable: true
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_cell: string, row: Branch) => (
                <>
                    <Button
                        variant="warning"
                        size="sm"
                        className="text-black"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditBranch(row);
                        }}
                        title="Edit"
                        classname="me-2"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBranch(row.branch_id);
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
                    Add Branch
                </>
            ),
            icon: undefined,
            variant: "primary",
            onClick: () => {
                setIsEditing(false);
                setNewBranch({ branch_id: "", branch_name: "", location: "", contact_number: 0 });
                setShowModal(true);
            }
        }
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">NCCC Branches</h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <DynamicTable<Branch>
                    data={branches}
                    columns={columns}
                    keyField="branch_id"
                    title="Branches"
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

            {/* Add/Edit Branch Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Edit Branch" : "Add New Branch"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Branch ID</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Branch ID"
                            value={newBranch.branch_id}
                            onChange={(e) => setNewBranch({ ...newBranch, branch_id: e.target.value })}
                            required
                            disabled={submitting || isEditing} // Disable editing branch_id when updating
                        />
                        {isEditing && <Form.Text className="text-muted">Branch ID cannot be modified</Form.Text>}
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Branch Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Branch Name"
                            value={newBranch.branch_name}
                            onChange={(e) => setNewBranch({ ...newBranch, branch_name: e.target.value })}
                            required
                            disabled={submitting}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Location"
                            value={newBranch.location}
                            onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                            required
                            disabled={submitting}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Contact</Form.Label>
                        <Form.Control
                            type="tel"
                            placeholder="Contact (numbers only)"
                            value={newBranch.contact_number || ''}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setNewBranch({ ...newBranch, contact_number: value ? parseInt(value, 10) : 0 });
                            }}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            required
                            disabled={submitting}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={isEditing ? handleUpdateBranch : handleAddBranch}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                {isEditing ? 'Updating...' : 'Adding...'}
                            </>
                        ) : (
                            isEditing ? "Update Branch" : "Add Branch"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Branches;