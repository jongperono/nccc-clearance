// DynamicTable.tsx - A reusable, sortable, searchable, paginated table component
import React from 'react';
import { Table, Button, Card, Form, InputGroup, Pagination } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { IconType } from 'react-icons';

// Column definition for table
export type ColumnDefinition<T extends Record<string, unknown>> = {
    dataField: keyof T;
    text: string; // Column header
    sortable?: boolean;
    minWidth?: string | number;
    formatter?: (cell: T[keyof T], row: T) => React.ReactNode;
};

// Custom button type for header actions
type CustomButton = {
    text: React.ReactNode; // allow JSX, not just string
    icon?: IconType;
    variant?: string;
    onClick: () => void;
};

// Sorting configuration
type SortConfig<T> = {
    key: keyof T | null;
    direction: 'asc' | 'desc';
};

// Props for DynamicTable
export type DynamicTableProps<T extends Record<string, unknown>> = {
    data: T[];
    columns: ColumnDefinition<T>[];
    keyField: keyof T;
    title?: string;
    customButtons?: CustomButton[];
    onRowClick?: (row: T) => void;
    striped?: boolean;
    hover?: boolean;
    bordered?: boolean;
    responsive?: boolean;
    showSearch?: boolean;
    showPagination?: boolean;
    pageSize?: number;
    className?: string;
    additionalFilters?: React.ReactNode;
    filterPredicate?: (item: T, searchTerm: string) => boolean;
};

// Main table component
const DynamicTable = <T extends Record<string, unknown>>({
    data = [],
    columns = [],
    keyField,
    title = 'Table',
    customButtons = [],
    onRowClick,
    striped = true,
    hover = true,
    bordered = false,
    responsive = true,
    showSearch = true,
    showPagination = true,
    pageSize = 10,
    className = '',
    filterPredicate
}: DynamicTableProps<T>) => {
    // State for search, pagination, and sorting
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortConfig, setSortConfig] = React.useState<SortConfig<T>>({ key: null, direction: 'asc' });

    // Filter data by search term
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;
        if (filterPredicate) return data.filter(item => filterPredicate(item, searchTerm));
        const term = searchTerm.toLowerCase();
        return data.filter(item =>
            columns.some(col => {
                const val = item[col.dataField];
                if (val == null) return false;
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')
                    return String(val).toLowerCase().includes(term);
                if (val instanceof Date)
                    return val.toLocaleDateString().toLowerCase().includes(term) ||
                        val.toLocaleString().toLowerCase().includes(term);
                if (typeof val === 'object')
                    return JSON.stringify(val).toLowerCase().includes(term);
                return false;
            })
        );
    }, [data, searchTerm, columns, filterPredicate]);

    // Sort data by selected column
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key!];
            const bVal = b[sortConfig.key!];
            if (aVal === bVal) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            return (aVal < bVal ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = React.useMemo(() => {
        if (!showPagination) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, showPagination]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

    // Handle sort request
    const requestSort = (key: keyof T) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <Card className={`shadow-sm ${className}`}>
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0 fw-bold">{title}</h6>
                <div className="d-flex">
                    {customButtons.map((btn, i) => (
                        <Button
                            key={`custom-btn-${i}`}
                            variant={btn.variant || 'primary'}
                            className="ms-2"
                            onClick={btn.onClick}
                            size="sm"
                            title={typeof btn.text === 'string' ? btn.text : undefined}
                        >
                            {btn.icon && <btn.icon className="me-1" size={13} />}
                            {btn.text}
                        </Button>
                    ))}
                </div>
            </Card.Header>
            <Card.Body>
                {showSearch && (
                    <div className="mb-2">
                        <InputGroup size="sm">
                            <InputGroup.Text><FiSearch size={14} /></InputGroup.Text>
                            <Form.Control
                                placeholder="Search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{ fontSize: '0.95rem' }}
                            />
                        </InputGroup>
                    </div>
                )}
                <div className="table-responsive">
                    <Table
                        striped={striped}
                        hover={hover}
                        bordered={bordered}
                        responsive={responsive}
                        className="align-middle" // removed text-center
                        size="sm"
                    >
                        <thead className="table-light">
                            <tr>
                                {columns.map(col => (
                                    <th
                                        key={String(col.dataField)}
                                        onClick={() => col.sortable && requestSort(col.dataField)}
                                        style={{
                                            cursor: col.sortable ? 'pointer' : 'default',
                                            minWidth: col.minWidth || 'auto',
                                            textAlign: col.text === "Actions" ? "center" : "left", // center only Actions
                                            fontSize: '0.97rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        <div className={`d-flex align-items-center${col.text === "Actions" ? " justify-content-center" : ""}`}>
                                            {col.text}
                                            {col.sortable && (
                                                <span className="ms-1">
                                                    {sortConfig.key === col.dataField ? (
                                                        sortConfig.direction === 'asc' ? <FaSortUp size={11} /> : <FaSortDown size={11} />
                                                    ) : (
                                                        <FaSort size={11} className="text-muted" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length ? paginatedData.map(item => (
                                <tr
                                    key={String(item[keyField])}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    style={{ cursor: onRowClick ? 'pointer' : 'default', fontSize: '0.95rem' }}
                                >
                                    {columns.map(col => (
                                        <td
                                            key={`${String(item[keyField])}-${String(col.dataField)}`}
                                            style={{
                                                textAlign: col.text === "Actions" ? "center" : "left", // center only Actions
                                                verticalAlign: 'middle'
                                            }}
                                        >
                                            {col.formatter ? col.formatter(item[col.dataField], item) : String(item[col.dataField])}
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-4 text-muted">
                                        No records
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
                {showPagination && totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="text-muted" style={{ fontSize: '0.93rem' }}>
                            {filteredData.length ? (
                                <>Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}</>
                            ) : 'No entries'}
                        </div>
                        <Pagination className="mb-0" size="sm">
                            <Pagination.Prev
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            />
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Pagination.Item
                                    key={page}
                                    active={page === currentPage}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            />
                        </Pagination>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default DynamicTable;