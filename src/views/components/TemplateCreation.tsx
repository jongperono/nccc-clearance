import React, { useState } from "react";
import { Button, Modal, Form, Card, Alert } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import TemplatePreviewModal from "./TemplatePreviewModal";
import { apiRequest } from "../../utils/ApiService";

// Template creation form and logic
const CreateTemplate: React.FC<any> = ({ onSubmit, onCancel }) => {
    // Form state
    const [formData, setFormData] = useState({
        title: "",
        purpose: "",
        footer_message: ""
    });
    // Modal states
    const [showSignatoryModal, setShowSignatoryModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    // Signatories state
    const [selectedSignatories, setSelectedSignatories] = useState<any[]>([]);
    const [availableSignatories, setAvailableSignatories] = useState<any[]>([]);
    const [tempSelectedSignatories, setTempSelectedSignatories] = useState<any[]>([]);
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Remove signatory
    const removeSignatory = (employeeId: string) => {
        setSelectedSignatories(prev => prev.filter(sig => sig.employee_id !== employeeId));
    };

    // Open signatory modal
    const openSignatoryModal = async () => {
        setTempSelectedSignatories([]);
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<{data: {data: any[], success: boolean, message: string}}>('/signatories', 'GET');

            if (response.data.success) {
                // Map API data to include display fields for company, department, branch
                const mappedSignatories = response.data.data
                    .filter(signatory =>
                        !selectedSignatories.some(selected => selected.employee_id === signatory.employee_id)
                    )
                    .map(signatory => ({
                        ...signatory,
                        // If you have lookup tables for names, replace these with actual names
                        company: signatory.company_id,
                        department: signatory.department_id,
                        branch: signatory.branch_id,
                    }));
                setAvailableSignatories(mappedSignatories);
            } else {
                setError('Failed to load signatories: ' + response.data.message);
            }
        } catch (err) {
            setError('Error loading signatories. Please try again.');
            console.error('Error fetching signatories:', err);
        } finally {
            setLoading(false);
            setShowSignatoryModal(true);
        }
    };

    // Select signatory
    const handleSelectSignatory = (signatory: any) => {
        if (tempSelectedSignatories.some(s => s.employee_id === signatory.employee_id)) {
            setTempSelectedSignatories(prev => prev.filter(s => s.employee_id !== signatory.employee_id));
        } else {
            setTempSelectedSignatories(prev => [...prev, signatory]);
        }
    };

    // Add selected signatories
    const addSelectedSignatories = () => {
        setSelectedSignatories(prev => [...prev, ...tempSelectedSignatories]);
        setShowSignatoryModal(false);
    };

    // Preview template
    const handlePreviewTemplate = () => {
        setShowPreviewModal(true);
    };

    // Submit template
    const handleSubmitTemplate = async () => {
        try {
            const templateData = {
                ...formData,
                signatories: selectedSignatories
            };
            await onSubmit(templateData);
            setShowPreviewModal(false);
        } catch (error) {
            console.error("Error submitting template:", error);
            setError("Failed to create template. Please try again.");
        }
    };

    // Table columns definition
    const columns: ColumnDefinition<any>[] = [
        { dataField: "employee_id", text: "Employee ID", sortable: true },
        { dataField: "full_name", text: "Signatory", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        {
            dataField: "id",
            text: "Actions",
            formatter: (_cell: number, row: any) => (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeSignatory(row.employee_id)}
                    aria-label={`Remove ${row.full_name}`}
                >
                    Remove
                </Button>
            )
        }
    ];

    // Signatory selection columns
    const signatoryColumns: ColumnDefinition<any>[] = [
        { dataField: "employee_id", text: "Employee ID", sortable: true },
        { dataField: "full_name", text: "Signatory", sortable: true },
        { dataField: "company", text: "Company", sortable: true },
        { dataField: "department", text: "Department", sortable: true },
        { dataField: "branch", text: "Branch", sortable: true },
        {
            dataField: "selected",
            text: "Select",
            formatter: (_cell: any, row: any) => (
                <Form.Check
                    type="checkbox"
                    checked={tempSelectedSignatories.some(s => s.employee_id === row.employee_id)}
                    onChange={() => handleSelectSignatory(row)}
                />
            )
        }
    ];

    const customButtons = [
        {
            text: "Add Signatory",
            icon: FaPlusCircle,
            variant: "primary",
            onClick: openSignatoryModal
        }
    ];

    return (
        <Card>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                    <Button variant="outline-secondary" onClick={onCancel} className="me-2 btn-warning">
                        &larr; Back
                    </Button>
                    <h5 className="mb-0 d-inline-block">Create New Clearance Template</h5>
                </div>
            </Card.Header>

            <Card.Body>
                <Form>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <Form.Label htmlFor="title">Template Title</Form.Label>
                            <Form.Control
                                type="text"
                                id="title"
                                placeholder="Template Title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                maxLength={32}
                            />
                        </div>
                        <div className="col-md-6">
                            <Form.Label htmlFor="purpose">Purpose</Form.Label>
                            <Form.Control
                                type="text"
                                id="purpose"
                                placeholder="Clearance purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                required
                                maxLength={35}
                            />
                            <Form.Text className="text-muted">Maximum 10 characters</Form.Text>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="footer_message">Footer Message</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            id="footer_message"
                            placeholder="Footer message, can be additional information or certification text"
                            value={formData.footer_message}
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <DynamicTable
                        data={selectedSignatories}
                        columns={columns}
                        keyField="employee_id"
                        title="Template Signatories"
                        customButtons={customButtons}
                        striped
                        hover
                        responsive
                        showSearch={false}
                        showPagination={false}
                        className="mb-4"
                    />

                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" className="me-2" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handlePreviewTemplate}
                            disabled={!formData.title || !formData.purpose}
                        >
                            Preview Template
                        </Button>
                    </div>
                </Form>
            </Card.Body>

            {/* Signatory Selection Modal */}
            <Modal show={showSignatoryModal} onHide={() => setShowSignatoryModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Signatories for the template</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading ? (
                        <p className="text-center">Loading signatories...</p>
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : availableSignatories.length > 0 ? (
                        <DynamicTable
                            data={availableSignatories}
                            columns={signatoryColumns}
                            keyField="employee_id"
                            title="Available Signatories"
                            striped
                            hover
                            responsive
                            showSearch={true}
                            showPagination={true}
                        />
                    ) : (
                        <p className="text-center text-muted py-4">No signatories available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSignatoryModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={addSelectedSignatories}
                        disabled={tempSelectedSignatories.length === 0 || loading}
                    >
                        Add Selected ({tempSelectedSignatories.length})
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Template Preview Modal */}
            <TemplatePreviewModal
                show={showPreviewModal}
                onHide={() => setShowPreviewModal(false)}
                onConfirm={handleSubmitTemplate}
                templateData={formData}
                selectedSignatories={selectedSignatories}
                formDataWithIds={formData}
            />
        </Card>
    );
};

export default CreateTemplate;
