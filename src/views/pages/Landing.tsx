import './Landing.css';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Image } from 'react-bootstrap';
import { useState } from 'react';
import LoginModal from '../components/LoginModal';
import bgImg from "../../assets/bg_img.webp";
import ncccLogo from "../../assets/nccc_logo.webp";

export default function Main() {
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
    };

    const trackClearanceClick = () => {
        navigate('/clearance-tracking');
    };

    return (
        <div className="landing-page">
            {/* <div className="bg-img"></div> */}
            <div className="bg-img" style={{ backgroundImage: `url(${bgImg})` }}></div>
            <Container className="d-flex flex-column align-items-center justify-content-center mt-5 text-center">
                <Image
                    src={ncccLogo}
                    alt="NCCC Logo"
                    className="img-fluid mb-4"
                    style={{ maxWidth: "300px" }}
                    rounded
                />
                <h2 className="fw-bold text-primary mb-4">ONLINE CLEARANCE SYSTEM</h2>
                <div className="d-flex flex-column gap-3">
                    <Button variant="primary" size="lg" onClick={handleLoginClick}>
                        Log in
                    </Button>
                    <Button variant="secondary" size="lg" onClick={trackClearanceClick}>
                        Track your clearance
                    </Button>
                </div>
            </Container>

            <LoginModal show={showLoginModal} onHide={handleCloseLoginModal} />
        </div>
    );
}
