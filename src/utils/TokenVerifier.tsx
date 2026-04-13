import { useEffect, useState, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./ApiService";
import { useCustomAlert } from "./CustomAlert";

interface TokenVerifierProps {
    children: ReactNode;
}

interface VerifyResponse {
    data: {
        success: boolean;
        message?: string;
        data: unknown;
    }
}

const TokenVerifier = ({ children }: TokenVerifierProps) => {
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useCustomAlert();
    const verificationAttempted = useRef(false);

    useEffect(() => {
        if (verificationAttempted.current) return;
        
        const verifyToken = async () => {
            verificationAttempted.current = true;
            console.log("Verifying your session...");
            
            try {
                const response = await apiRequest<VerifyResponse>("/verify", "GET");
                const responseData = response.data;

                if (responseData.success) {
                    setIsVerified(true);
                    setIsLoading(false);
                } else {
                    console.error("Token verification failed:", responseData.message);
                    navigate("/");
                    showAlert("error", "Session verification failed. Please log in again.");
                }
            } catch (error) {
                console.error("Token verification error:", error);
                navigate("/");
                showAlert("error", "Unable to verify your session. Please log in again.");
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [navigate, showAlert]);
    
    return (
        <>
            {AlertComponent}
            {isVerified && !isLoading ? children : null}
        </>
    );
};

export default TokenVerifier;
