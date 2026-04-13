import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";
import { apiRequest } from "../../utils/ApiService";

interface ClearanceItemType {
    id: number;
    name?: string;
    department?: string;
    type?: string;
    date?: string;
    status?: string;
    manager?: string;
    userName?: string;
}

interface MessageThreadModalProps {
    show: boolean;
    onHide: () => void;
    selectedItem: ClearanceItemType | null;
}

interface RemarkEntry {
    id?: number;
    clearance_id: number;
    employee_id: number;
    remark: string;
    createdAt?: string;
}

const MessageThreadModal: React.FC<MessageThreadModalProps> = ({
    show,
    onHide,
    selectedItem,
}) => {
    const [remarks, setRemarks] = useState<RemarkEntry[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [employeeId, setEmployeeId] = useState<number | null>(
        () => Number(localStorage.getItem("employee_id")) || null
    );

    // Fallback: fetch employee_id from session if not in localStorage
    useEffect(() => {
        if (employeeId) return;
        apiRequest<any>("/check-permissions", "GET")
            .then((res) => {
                const data = res?.data?.data || {};
                const id = data?.employee_id ?? data?.id ?? null;
                if (id) {
                    localStorage.setItem("employee_id", String(id));
                    setEmployeeId(Number(id));
                }
            })
            .catch(() => { });
    }, []);

    // Fetch remarks when modal opens
    useEffect(() => {
        if (!show || !selectedItem) return;
        setLoading(true);
        setError(null);
        apiRequest<any>(`/remarks-from-clearance/${selectedItem.id}`, "GET")
            .then((res) => {
                const data = res?.data?.data ?? res?.data ?? [];
                setRemarks(Array.isArray(data) ? data : []);
            })
            .catch(() => setError("Failed to load remarks."))
            .finally(() => setLoading(false));
    }, [show, selectedItem]);

    const handleSend = async () => {
        console.log('employee trace', employeeId)
        if (!newMessage.trim() || !selectedItem) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await apiRequest<any>(`/remark`, "POST", {
                clearance_id: selectedItem.id,
                employee_id: localStorage.getItem('employee_id'),
                remark: newMessage.trim(),
            });
            const created = res?.data?.data;
            setRemarks((prev) => [...prev, created ?? {
                clearance_id: selectedItem.id,
                employee_id: employeeId,
                remark: newMessage.trim(),
                createdAt: new Date().toISOString(),
            }]);
            setNewMessage("");
        } catch (err: any) {
            setError(err?.message || "Failed to submit remark.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Remarks — {selectedItem?.name || selectedItem?.userName || "Clearance"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div
                    className="p-3 mb-3"
                    style={{
                        maxHeight: "380px",
                        overflowY: "auto",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6",
                    }}
                >
                    {loading ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : remarks.length === 0 ? (
                        <p className="text-muted text-center mb-0">No remarks yet.</p>
                    ) : (
                        remarks.map((r, idx) => (
                            <div key={r.id ?? idx} className="mb-3">
                                <div
                                    className="p-3 rounded-3 shadow-sm bg-white"
                                    style={{ wordBreak: "break-word" }}
                                >
                                    <div className="fw-semibold text-primary mb-1" style={{ fontSize: "0.8rem" }}>
                                        {(r as any).Employee?.full_name
                                            || [(r as any).Employee?.first_name, (r as any).Employee?.middle_name, (r as any).Employee?.last_name].filter(Boolean).join(" ")
                                            || `Employee #${r.employee_id}`}
                                    </div>
                                    <div>{r.remark}</div>
                                </div>
                                {r.createdAt && (
                                    <small className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>
                                        {new Date(r.createdAt).toLocaleString()}
                                    </small>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <Form.Group>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your remark..."
                        className="mb-2"
                    />
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        className="w-100"
                        disabled={submitting || !newMessage.trim()}
                    >
                        {submitting ? <Spinner animation="border" size="sm" /> : "Submit Remark"}
                    </Button>
                </Form.Group>
            </Modal.Body>
        </Modal>
    );
};

export default MessageThreadModal;
