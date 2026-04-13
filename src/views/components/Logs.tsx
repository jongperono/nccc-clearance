import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import DynamicTable, { ColumnDefinition } from "../../utils/DynamicTable";

// Log entry interface for logs table
interface LogEntry {
    name: string;
    action: string;
    role: string;
    ip: string;
    time: string;
    date: string;
}

// Sample logs data
const logsData: LogEntry[] = [
    { name: "Franco Zachary Pasaporte", action: "Logged in as Employee", role: "Admin", ip: "192.168.1.1", time: "9:54 am", date: "03-05-2025" },
    { name: "Raylanz Delf Lora", action: "Logged in as Admin", role: "Employee", ip: "192.168.1.2", time: "10:00 am", date: "03-04-2025" },
    { name: "Krizia Mae Jotoy", action: "Pending Clearance", role: "Employee", ip: "192.168.1.3", time: "9:30 am", date: "03-05-2025" },
    { name: "Dustin Jethro Morano", action: "Cleared", role: "Employee", ip: "192.168.1.4", time: "9:54 am", date: "03-05-2025" },
    { name: "John Doe", action: "Logged in as Employee", role: "Employee", ip: "192.168.1.5", time: "8:15 am", date: "03-05-2025" },
    { name: "Jane Smith", action: "Pending Clearance", role: "Employee", ip: "192.168.1.6", time: "9:00 am", date: "03-05-2025" },
    { name: "Michael Jordan", action: "Cleared", role: "Admin", ip: "192.168.1.7", time: "10:30 am", date: "03-05-2025" },
];

// Get icon for log action
const getStatusIcon = (action: string): string => {
    switch (action) {
        case "Logged in as Employee":
        case "Logged in as Admin":
            return "🟢";
        case "Pending Clearance":
            return "⚠️";
        case "Cleared":
            return "✅";
        default:
            return "⚪";
    }
};

const Logs = () => {
    const [filter, setFilter] = useState("All");

    // Table columns
    const columns: ColumnDefinition<LogEntry>[] = [
        { dataField: "name", text: "Name", sortable: true },
        { dataField: "ip", text: "IP Address", sortable: true },
        { 
            dataField: "action", 
            text: "Action", 
            sortable: true,
            formatter: (action: string) => (
                <>
                    {getStatusIcon(action)} <strong>{action}</strong>
                </>
            )
        },
        { dataField: "time", text: "Time", sortable: true },
        { dataField: "date", text: "Date", sortable: true },
        {
            dataField: "name",
            text: "View",
            formatter: () => (
                <Button variant="primary" size="sm">
                    View
                </Button>
            )
        }
    ];

    // Filter predicate for logs
    const filterPredicate = (log: LogEntry, searchTerm: string) => {
        return (
            (filter === "All" || log.action === filter) &&
            (log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ip.includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    };

    // Action filter options
    const actionOptions = [
        { value: "All", label: "All Actions" },
        { value: "Logged in as Employee", label: "Logged in as Employee" },
        { value: "Logged in as Admin", label: "Logged in as Admin" },
        { value: "Pending Clearance", label: "Pending Clearance" },
        { value: "Cleared", label: "Cleared" }
    ];

    return (
        <div className="container-fluid p-2 p-md-4">
            <h2 className="mb-3 mb-md-4 text-primary border-bottom pb-2 fs-4 fs-md-2">Activity Logs</h2>
            
            <DynamicTable<LogEntry>
                data={logsData}
                columns={columns}
                keyField="ip" // Using IP as key since it should be unique
                title="Activity Logs"
                striped
                hover
                responsive
                showSearch
                showPagination
                pageSize={10}
                additionalFilters={
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mt-2 mt-sm-0">
                        <label htmlFor="actionFilter" className="me-2 mb-1 mb-sm-0 small text-muted">Action:</label>
                        <Form.Select
                            id="actionFilter" 
                            className="form-select-sm"
                            style={{ width: '180px' }}
                            onChange={(e) => setFilter(e.target.value)} 
                            value={filter}
                        >
                            {actionOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                }
                filterPredicate={filterPredicate}
            />
            
            {/* Responsive helper text visible only on small devices */}
            <div className="d-block d-md-none mt-3">
                <p className="text-muted small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Scroll horizontally to view all data
                </p>
            </div>
        </div>
    );
};

export default Logs;