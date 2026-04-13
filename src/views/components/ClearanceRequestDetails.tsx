import React from 'react';
import { Row, Col } from 'react-bootstrap';

// Clearance request details display component
interface ClearanceRequestDetailsProps {
    id: number;
    companyId: string;
    name: string;
    email: string;
    branch: string;
    department: string;
    company?: string;
    dateOfApplication?: string;
    purpose: string;
    status?: "Pending" | "In Progress" | "Approved" | "Cleared";
}

const ClearanceRequestDetails: React.FC<ClearanceRequestDetailsProps> = ({
    id,
    companyId,
    name,
    email,
    branch,
    department,
    company = "NCCC",
    dateOfApplication = new Date().toLocaleDateString(),
    purpose,
    status,
}) => {
    return (
        <div className="employee-details p-3 border-top border-bottom bg-light">
            <Row className="mb-2">
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>ID No.:</span>
                        <span>{id}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Company:</span>
                        <span>{company}</span>
                    </div>
                </Col>
            </Row>
            <Row className="mb-2">
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Name:</span>
                        <span>{name}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Email:</span>
                        <span>{email}</span>
                    </div>
                </Col>
            </Row>
            <Row className="mb-2">
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Branch:</span>
                        <span>{branch}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Department:</span>
                        <span>{department}</span>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Purpose:</span>
                        <span>{purpose}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex">
                        <span className="fw-bold" style={{ width: '120px' }}>Date Applied:</span>
                        <span>{dateOfApplication}</span>
                    </div>
                </Col>
            </Row>
            {status && (
                <Row>
                    <Col md={6}>
                        <div className="d-flex">
                            <span className="fw-bold" style={{ width: '120px' }}>Status:</span>
                            <span className={
                                status === "Pending" ? "text-primary" :
                                status === "In Progress" ? "text-warning" :
                                status === "Approved" ? "text-success" : "text-info"
                            }>
                                {status}
                            </span>
                        </div>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default ClearanceRequestDetails;
