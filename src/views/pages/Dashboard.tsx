import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import "./Dashboard.css";
import DashboardContent from "../components/DashboardContent";
import ClearanceRequest from "../components/ClearanceRequest";
import CreateTemplate from "../components/Templates";
import Status from "../components/Status";
import Logs from "../components/Logs";
import Company from "../components/Company"
import Employee from "../components/Employee";
import Branches from "../components/Branch"
import Roles from "../components/Roles";
import Sidebar from "../components/Sidebar";
import Departments from "../components/Departments";
import Clearances from "../components/Clearances";

const Dashboard: React.FC = () => {
    const [selectedPage, setSelectedPage] = useState<string>("Home");
    const [showSidebar, setShowSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

    // Handle window resize events
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 576);
            if (window.innerWidth > 576) {
                setShowSidebar(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const pages: Record<string, React.ReactNode> = {
        Home: <DashboardContent />,
        Requests: <ClearanceRequest />,
        Clearances: <Clearances />,
        Templates: <CreateTemplate />,
        Status: <Status />,
        Logs: <Logs />,
        Company: <Company />,
        Employee: <Employee />,
        Roles: <Roles />,
        Departments:<Departments/>,
        Branches: <Branches/>,
    };

    return (
        <Container fluid className="d-flex p-0">
            {/* Sidebar with responsive width */}
            <div className={`sidebar-container ${showSidebar ? 'show' : ''}`}>
                <Sidebar onSelect={(page) => {
                    setSelectedPage(page);
                    if (isMobile) setShowSidebar(false);
                }} />
            </div>
    
            {/* Main Content */}
            <div className="dashboard-content">
                {isMobile && (
                    <button 
                        className="btn btn-sm btn-primary mb-3"
                        onClick={toggleSidebar}
                    >
                        {showSidebar ? '✖' : '☰'}
                    </button>
                )}
                {pages[selectedPage] || <div>Page not found</div>}
            </div>
        </Container>
    );
};

export default Dashboard;
