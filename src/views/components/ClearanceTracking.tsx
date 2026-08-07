import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/ApiService';
import bgImg from "../../assets/bg_img.webp";
import ncccLogo from "../../assets/nccc_logo.png";

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
                setError(res.message || 'Clearance not found. Please check your tracking ID.');
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
        <div style={{
            minHeight: '100vh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
        }}>
            {/* Background image */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
            }} />
            {/* Dark overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(15,30,60,0.82) 0%, rgba(37,99,235,0.72) 100%)',
                zIndex: 1,
            }} />

            {/* Card */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255,255,255,0.97)',
                borderRadius: '20px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)',
                overflow: 'hidden',
            }}>
                {/* Card top accent bar */}
                <div style={{
                    height: '6px',
                    background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 100%)',
                }} />

                <div style={{ padding: '32px 28px 28px' }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img
                            src={ncccLogo}
                            alt="NCCC Logo"
                            style={{ width: '80px', height: 'auto', marginBottom: '12px' }}
                        />
                        <h1 style={{
                            fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                            fontWeight: 800,
                            color: '#1e3a5f',
                            margin: 0,
                            letterSpacing: '0.02em',
                            lineHeight: 1.3,
                        }}>
                            ONLINE CLEARANCE SYSTEM
                        </h1>
                        <p style={{
                            margin: '6px 0 0',
                            fontSize: '0.82rem',
                            color: '#64748b',
                            letterSpacing: '0.04em',
                        }}>
                            NCCC Group of Companies
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
                        margin: '0 0 24px',
                    }} />

                    {/* Form heading */}
                    <div style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '20px' }}>🔍</span>
                            <h2 style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: '#1e293b',
                                margin: 0,
                            }}>
                                Track Your Clearance
                            </h2>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, paddingLeft: '28px' }}>
                            Enter your tracking ID to check your clearance status.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleTrackingSubmit}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: '6px',
                            }}>
                                Tracking ID
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. CLR-2025-00123"
                                value={trackingId}
                                onChange={handleInputChange}
                                autoComplete="off"
                                style={{
                                    borderRadius: '10px',
                                    border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                                    padding: '11px 14px',
                                    fontSize: '0.95rem',
                                    background: '#f8fafc',
                                    transition: 'border-color 0.2s',
                                    outline: 'none',
                                    width: '100%',
                                }}
                                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                                onBlur={e => (e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0')}
                            />
                            {error && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '8px',
                                    padding: '8px 12px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    color: '#dc2626',
                                }}>
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '13px',
                                background: loading
                                    ? '#93c5fd'
                                    : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                                transition: 'all 0.2s',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    Searching...
                                </>
                            ) : (
                                <>🔍 Track Clearance</>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        margin: '20px 0 0',
                    }}>
                        Your tracking ID is provided when a clearance request is submitted.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ClearanceTracking;
