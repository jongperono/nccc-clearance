import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useCustomAlert } from '../../utils/CustomAlert';
import { apiRequest } from '../../utils/ApiService';

interface ChangePasswordModalProps {
    show: boolean;
    onHide: () => void;
    employeeId?: number;
}

export default function ChangePasswordModal({ show, onHide, employeeId }: ChangePasswordModalProps) {
    const { showAlert, AlertComponent } = useCustomAlert();
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Validate password requirements
    const validatePassword = (password: string): boolean => {
        if (password.length < 6) {
            showAlert('error', 'Password must be at least 6 characters long.');
            return false;
        }
        return true;
    };

    // Handle password change
    const handleChangePassword = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            showAlert('error', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('error', 'New password and confirm password do not match.');
            return;
        }

        if (!validatePassword(newPassword)) {
            return;
        }

        setLoading(true);
        try {
            const url = `/employee/${employeeId}/change-password`;
            await apiRequest<any>(url, 'PUT', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            showAlert('success', 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onHide();
            }, 500);
        } catch (error: any) {
            if (error.message && error.message.includes('401')) {
                showAlert('error', 'Current password is incorrect.');
            } else if (error.message && error.message.includes('400')) {
                showAlert('error', 'Invalid password format.');
            } else {
                showAlert('error', 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onHide();
    };

    return (
        <>
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold text-primary">Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {AlertComponent}
                    <div className="d-flex justify-content-center align-items-center flex-column">
                        <Form className="w-100">
                            <Form.Group className="mb-3">
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Form>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
