import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ClearanceTracking from "./components/ClearanceTracking";
import ClearanceTrackingDetails from "./components/ClearanceTrackingDetails";

import { useCustomAlert } from "../utils/CustomAlert";
import TokenVerifier from "../utils/TokenVerifier";
import 'bootstrap/dist/css/bootstrap.css';
import './Custom.css';

function App() {
    const { AlertComponent } = useCustomAlert();

    return (
        <>
            <Router>
                <Routes>
                    {/* public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/clearance-tracking" element={<ClearanceTracking />} />
                    <Route path="/clearance-tracking/:trackingId" element={<ClearanceTrackingDetails />} />
                    
                    {/* private routes - protected with TokenVerifier */}
                    <Route path="/dashboard" element={
                        <TokenVerifier>
                            <Dashboard />
                        </TokenVerifier>
                    } />
                </Routes>
            </Router>
            {AlertComponent}
        </>
    );
}

export default App;
