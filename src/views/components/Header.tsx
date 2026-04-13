// Header component for displaying user info
import { FaUser } from "react-icons/fa";

interface HeaderProps {
    user: string;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold">Welcome, {user}!</h3>
            <div className="user-profile d-flex align-items-center">
                <span className="fw-bold me-2">Administrator</span>
                <FaUser size={30} style={{ color: "#007bff" }} />  
            </div>
        </div>
    );
};

export default Header;
