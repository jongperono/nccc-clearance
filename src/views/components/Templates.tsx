import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";
import CreateTemplate from "./TemplateCreation";
import TemplatePreviewModal from "./TemplatePreviewModal";

// Template list and management
interface SignatoryData {
    template_id: number;
    employee_id: number;
    employee: {
        employee_id: number;
        first_name: string;
        last_name: string;
        email: string;
        role_id: string;
        company_id: string;
        department_id: string;
        branch_id: string;
    };
    createdAt?: string;
    updatedAt?: string; 
}

interface TemplateData {
    template_id: number;
    title: string;
    purpose: string;
    footer_message?: string;
    creator_employee_id: number;
    updater_employee_id?: number;
    creator_name?: string;
    updater_name?: string;
}

const Template: React.FC = () => {
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [templatePreviewData, setTemplatePreviewData] = useState({
        title: "",
        purpose: "",
        footer_message: ""
    });
    const [selectedSignatories, setSelectedSignatories] = useState<any[]>([]);
    const { showAlert, AlertComponent } = useCustomAlert();

    // Fetch templates from API
    const fetchTemplates = async () => {
        try {
            const response = await apiRequest("/templates", "GET");
            const rawTemplates = response.data?.data || [];
            const mappedTemplates = rawTemplates.map((tpl: any) => ({
                template_id: tpl.template_id,
                title: tpl.title,
                purpose: tpl.purpose,
                footer_message: tpl.footer_message,
                creator_employee_id: tpl.creator_employee_id,
                updater_employee_id: tpl.updater_employee_id,
                createdAt: tpl.createdAt,
                updatedAt: tpl.updatedAt,
                deletedAt: tpl.deletedAt,
                creator_name: tpl.creator_employee
                    ? `${tpl.creator_employee.first_name} ${tpl.creator_employee.last_name}`
                    : "Unknown",
                creator_email: tpl.creator_employee?.email,
            }));
            setTemplates(mappedTemplates);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    // View template details
    const handleViewTemplate = async (template: TemplateData) => {
        setSelectedTemplate(template);
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

    // Delete template
    const handleDeleteTemplate = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await apiRequest(`/template/${id}`, "DELETE");
                showAlert("success", "Template deleted successfully.");
                fetchTemplates();
            } catch {
                showAlert("error", "Failed to delete template.");
            }
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const columns: ColumnDefinition<TemplateData <string, unknown>  & {creator_email?: string}>[] = [
        {
            dataField: "title",
            text: "Template Title", // changed here
            sortable: true,
            minWidth: '220px',
            formatter: (title, row) => (
                <div>
                    <h5 className="mb-1 text-primary">{title}</h5>
                    {row.purpose && (
                        <small className="text-muted d-block">{row.purpose}</small>
                    )}
                </div>
            )
        },
        {
            dataField: "creator_name",
            text: "Created By",
            minWidth: '160px',
            formatter: (creator, row) => (
                <div>
                    <span className="fw-semibold">{creator}</span>
                    {row.creator_email && (
                        <small className="d-block text-muted">{row.creator_email}</small>
                    )}
                </div>
            )
        },
        {
            dataField: "createdAt",
            text: "Created Date",
            minWidth: '120px',
            sortable: true,
            formatter: (createdAt) => (
                <span>
                    {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
                </span>
            )
        },
        {
            dataField: "template_id",
            text: "Actions",
            minWidth: '120px',
            formatter: (_id, row) => (
                <>
                    <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewTemplate(row)}
                    >
                        View
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="me-2"
                        onClick={() => handleDeleteTemplate(row.template_id)}
                    >
                        Delete
                    </Button>
                </>
            )
        }
    ];

    const filterPredicate = (template: any, searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        return (
            template.title?.toLowerCase().includes(term) ||
            template.purpose?.toLowerCase().includes(term) ||
            template.creator_name?.toLowerCase().includes(term)
        );
    };

    const customButtons = [
        {
            text: (
                <>
                    <FaPlus className="me-2" />
                    Create New Template
                </>
            ),
            icon: undefined,
            variant: "primary",
            onClick: () => setShowCreateTemplate(true)
        }
    ];

    const sortOptions = [
        { value: "asc", label: "Sort by Date (Oldest First)" },
        { value: "desc", label: "Sort by Date (Newest First)" }
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">Clearance Templates</h2>
            {AlertComponent}
            <TemplatePreviewModal
                show={showViewModal}
                onHide={() => setShowViewModal(false)}
                templateData={templatePreviewData}
                selectedSignatories={selectedSignatories}
                showConfirmButton={false}
            />
            {showCreateTemplate ? (
                <CreateTemplate
                    onSubmit={() => {
                        fetchTemplates();
                        setShowCreateTemplate(false);
                        showAlert("success", "Template created successfully.");
                    }}
                    onCancel={() => setShowCreateTemplate(false)}
                />
            ) : (
                <DynamicTable
                    data={templates}
                    columns={columns}
                    keyField="template_id"
                    title="Clearance Templates"
                    customButtons={customButtons}
                    striped
                    hover
                    responsive
                    showSearch
                    showPagination
                    pageSize={10}
                    additionalFilters={
                        <select
                            className="form-select ms-2"
                            style={{ width: '250px' }}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    }
                    filterPredicate={filterPredicate}
                />
            )}
        </div>
    );
};

export default Template;