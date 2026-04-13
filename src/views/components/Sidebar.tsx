import React, { useState, useEffect } from "react";
import {
    FaHome, FaTasks, FaFileAlt, FaHistory, FaSignOutAlt,
    FaUser, FaDatabase, FaChevronDown, FaChevronRight, FaUserTie, 
    FaWarehouse,
    FaBuilding,
    FaCity,
    FaClipboardCheck
} from "react-icons/fa";
import "./Sidebar.css"; 
import { apiRequest } from "../../utils/ApiService";
import { useCustomAlert } from "../../utils/CustomAlert";

// Sidebar navigation component
interface SidebarProps {
    onSelect: (page: string) => void;
}

// Define a type for our permissions
interface Permissions {
    is_signatory?: boolean;
    can_assign_clearances?: boolean;
    can_create_roles?: boolean;
    can_create_accounts?: boolean;
    can_create_companies?: boolean;
    can_create_departments?: boolean;
    can_create_branches?: boolean;
    can_create_templates?: boolean;
    can_access_logs?: boolean;
    can_access_all_clearances?: boolean; // <-- Added
    can_create_clearance_requests?: boolean; // <-- Added
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const [isMasterOpen, setIsMasterOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [loading, setLoading] = useState(true);
    const { showAlert, AlertComponent } = useCustomAlert();

    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth <= 768);
            if (window.innerWidth <= 768) {
                setIsMasterOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        apiRequest<any>("/check-permissions", "GET")
            .then(response => {
                console.log("Full API response:", response);
                
                // The permissions are nested inside response.data.data
                if (response.data && response.data.data) {
                    console.log("Setting permissions to:", response.data.data);
                    setPermissions(response.data.data);
                } else {
                    console.log("No permissions found in response");
                    setPermissions(null);
                }
            })
            .catch(error => {
                console.error("Error fetching permissions:", error);
                setPermissions(null);
            })
            .finally(() => setLoading(false));
    }, []);

    // Handle master menu click
    const handleMasterClick = () => {
        if (!isCollapsed || document.querySelector('.sidebar-container')?.classList.contains('show')) {
            setIsMasterOpen(!isMasterOpen);
        } else {
            onSelect("Employee");
        }
    };

    // Logout handler: delete token cookie, show alert, redirect
    const handleLogout = () => {
        // Delete the "token" cookie
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        showAlert("success", "Logged out successfully!");
        setTimeout(() => {
            window.location.href = "/";
        }, 1000);
    };

    // If permissions are loading, show a loading indicator
    if (loading) {
        return <div className="sidebar-loading">Loading...</div>;
    }

    // If permissions are not loaded (fetch failed or unauthorized), render nothing or a fallback
    if (!permissions) return null;

    console.log("Permissions for rendering:", permissions);

    // Safely extract permissions with defaults to false
    const {
        can_create_roles = false,
        can_create_accounts = false,
        can_create_companies = false,
        can_create_departments = false,
        can_create_branches = false,
        can_create_templates = false,
        can_access_logs = false,
        can_access_all_clearances = false, // <-- Added
        can_create_clearance_requests = false, // <-- Added
    } = permissions || {};

    // Check if user should see Master Files section
    const shouldShowMasterFiles = 
        can_create_roles || 
        can_create_accounts || 
        can_create_companies || 
        can_create_departments || 
        can_create_branches;

    return (
        <div className="sidebar">
            {/* Render alert at the top */}
            {AlertComponent}
            <div className="sidebar-logo">
                <img src="/src/assets/nccc_logo.webp" alt="Logo" className="logo-img" />
                <h6 className="sidebar-title">Online Clearance</h6>
            </div>
            <div className="sidebar-menu">
                <button 
                    className="sidebar-btn active" 
                    onClick={() => onSelect("Home")}
                >
                    <FaHome className="icon" />
                    <span>Home</span>
                </button>
                <button className="sidebar-btn" onClick={() => onSelect("Clearances")}> 
                    <FaClipboardCheck className="icon" />
                    <span>Clearances</span>
                </button>
                {can_create_clearance_requests && (
                    <button className="sidebar-btn" onClick={() => onSelect("Requests")}> 
                        <FaTasks className="icon" />
                        <span>Requests</span>
                    </button>
                )}
                
                {/* Master Files Section with Dropdown */}
                {shouldShowMasterFiles && (
                    <>
                        <button className="sidebar-btn" onClick={handleMasterClick}>
                            <FaDatabase className="icon" />
                            <span>Master Files</span>
                            {isMasterOpen ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />}
                        </button>
                        {isMasterOpen && (
                            <div className="sidebar-submenu">
                                {can_create_roles && (
                                    <button className="sidebar-btn sub-btn" onClick={() => onSelect("Roles")}>
                                        <FaUserTie className="icon" />
                                        <span>Roles</span>
                                    </button>
                                )}
                                {can_create_accounts && (
                                    <button className="sidebar-btn" onClick={() => onSelect("Employee")}>
                                        <FaUser className="icon" />
                                        <span>Employees</span>
                                    </button>
                                )}
                                {can_create_companies && (
                                    <button className="sidebar-btn" onClick={() => onSelect("Company")}>
                                        <FaCity className="icon" />
                                        <span>Companies</span>
                                    </button>
                                )}
                                {can_create_departments && (
                                    <button className="sidebar-btn sub-btn" onClick={() => onSelect("Departments")}>
                                        <FaBuilding className="icon" />
                                        <span>Departments</span>
                                    </button>
                                )}
                                {can_create_branches && (
                                    <button className="sidebar-btn sub-btn" onClick={() => onSelect("Branches")}>
                                        <FaWarehouse className="icon" />
                                        <span>Branches</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
                {can_create_templates && (
                    <button className="sidebar-btn" onClick={() => onSelect("Templates")}>
                        <FaFileAlt className="icon" />
                        <span>Templates</span>
                    </button>
                )}
                {can_access_logs && (
                    <button className="sidebar-btn" onClick={() => onSelect("Logs")}>
                        <FaHistory className="icon" />
                        <span>Logs</span>
                    </button>
                )}
            </div>
            <div className="sidebar-bottom">
                <button className="sidebar-btn logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="icon logout-icon" />
                    <span className="logout-text">Log out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
