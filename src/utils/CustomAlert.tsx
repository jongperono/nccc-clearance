import React, { useState, useEffect } from "react";

type AlertType = "success" | "error" | "info";

interface CustomAlertProps {
    type: AlertType;
    message: string;
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ type, message, onClose }) => {
    useEffect(() => {
        // Auto dismiss after 5 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        
        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "info":
                return "ℹ️";
            default:
                return "";
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case "success":
                return '#d4edda';
            case "error":
                return '#f8d7da';
            case "info":
                return '#d1ecf1';
            default:
                return 'white';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case "success":
                return '#155724';
            case "error":
                return '#721c24';
            case "info":
                return '#0c5460';
            default:
                return 'black';
        }
    };

    const alertStyle: React.CSSProperties = {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '15px 20px',
        borderRadius: '5px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        transition: 'all 0.3s ease-in-out',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        fontWeight: 'bold',
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0',
        color: getTextColor(),
    };

    return (
        <div style={alertStyle}>
            <div style={headerStyle}>
                <div>
                    {getIcon()} {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <button style={closeButtonStyle} onClick={onClose}>×</button>
            </div>
            <div>{message}</div>
        </div>
    );
};

export const useCustomAlert = () => {
    const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

    const showAlert = (type: AlertType, message: string) => {
        setAlert({ type, message });
    };

    const hideAlert = () => {
        setAlert(null);
    };

    const AlertComponent = alert ? (
        <CustomAlert type={alert.type} message={alert.message} onClose={hideAlert} />
    ) : null;

    return { showAlert, AlertComponent };
};

export default CustomAlert;
