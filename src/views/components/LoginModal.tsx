import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import cookie from 'universal-cookie';
import { useCustomAlert } from '../../utils/CustomAlert';
import { apiRequest } from '../../utils/ApiService';

// Login modal for employee authentication
interface LoginModalProps {
    show: boolean;
    onHide: () => void;
}

export default function LoginModal({ show, onHide }: LoginModalProps) {
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useCustomAlert();
    const [employeeId, setEmployeeId] = useState<string>('');
    const [employeePassword, setEmployeePassword] = useState<string>('');

    // Handle login form submit
    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!employeeId.trim() || !employeePassword.trim()) {
            showAlert('error', 'Please fill in all fields.');
            return;
        }
        const url = '/login';
        console.log('loginnnnnnnnn', employeeId)
        try {
            const data = await apiRequest<any>(url, 'POST', {
                employee_id: employeeId,
                password: employeePassword,
            });
            console.log('------------1')
            const token = data.data['token'];
            console.log('token ', token)
            new cookie().set('token', token);
            localStorage.setItem('employee_id', String(employeeId));
            showAlert('success', 'Login successful!');
            await new Promise(resolve => setTimeout(resolve, 300));
            onHide();
            console.log('------------------2')
            navigate('/dashboard');
        } catch (error: any) {
            if (error.message && error.message.includes('404') || error.message.includes('401')) {
                return showAlert('error', 'Invalid credentials!');
            }
            showAlert('error', 'An unexpected error occurred.');
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold text-primary">Log In</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-center align-items-center flex-column">
                        <Form className="w-100">
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="number"
                                    placeholder="Employee ID"
                                    value={employeeId}
                                    onChange={e => setEmployeeId(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    value={employeePassword}
                                    onChange={e => setEmployeePassword(e.target.value)}
                                />
                            </Form.Group>
                            <Button
                                variant="primary"
                                className="w-100 text-light fw-bold"
                                onClick={handleLogin}
                                type="submit"
                            >
                                Log In
                            </Button>
                        </Form>
                    </div>
                </Modal.Body>
            </Modal>
            {AlertComponent}
        </>
    );
}
