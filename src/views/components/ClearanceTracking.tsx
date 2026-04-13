import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/ApiService';

// Clearance tracking page for tracking clearance
function ClearanceTracking() {
    const [trackingId, setTrackingId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTrackingId(e.target.value);
        setError(null);
    };

    const handleTrackingSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!trackingId.trim()) {
            setError('Please enter a tracking ID.');
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest<{ status: number; success: boolean; message?: string; data?: any }>(
                `/clearance/tracking/${trackingId}/`,
                'GET'
            );
            const res = data && (data as any).data ? (data as any).data : data;
            if (!res.success) {
                setError(res.message || 'Clearance not found.');
            } else {
                navigate(`/clearance-tracking/${trackingId}`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch clearance details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex flex-row justify-content-center align-items-center mt-5">
            <div className="logIn_logo w-45 h-50 mx-auto mt-5">
                <div className="d-flex flex-column align-items-center justify-content-center text-center">
                    <img src="src/assets/nccc_logo.webp" alt="NCCC Logo" className="img-fluid" style={{ maxWidth: "300px" }} />
                    <h2 className="fw-bold">TRACK YOUR CLEARANCE</h2>
                </div>
            </div>
            <div className="card w-25 h-50 mx-auto mt-5">
                <div className="card-body">
                    <form className="d-flex justify-content-center align-items-center flex-column" onSubmit={handleTrackingSubmit}>
                        <h2 className="fw-bold text-primary text-center">Track Clearance</h2>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Tracking ID"
                            value={trackingId}
                            onChange={handleInputChange}
                        />
                        <button
                            className="btn btn-primary w-100 text-light fw-bold"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Track'}
                        </button>
                        {error && <div className="text-danger mt-2">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ClearanceTracking;
