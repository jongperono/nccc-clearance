// import React from "react";
// import { Modal, Button } from "react-bootstrap";
// import ncccLogo from "../../assets/nccc_logo.webp";

// // Modal for displaying clearance details
// interface ClearanceDetailsModalProps {
//     show: boolean;
//     onHide: () => void;
//     data: any;
// }

// const ClearanceDetailsModal: React.FC<ClearanceDetailsModalProps> = ({ show, onHide, data }) => {
//     if (!data) return null;

//     // Parse name fields
//     const nameParts = data.name?.trim().split(" ") || [];
//     const first_name = data.first_name || nameParts[0] || "N/A";
//     const middle_name =
//         data.middle_name ||
//         (nameParts.length >= 3 ? nameParts.slice(1, -1).join(" ") : nameParts.length === 2 ? nameParts[1] : "N/A");
//     const last_name =
//         data.last_name || (nameParts.length >= 2 ? nameParts[nameParts.length - 1] : "N/A");
//     const email = data.email || "N/A";
//     const company = data.company || "N/A";
//     const branch = data.branch || "N/A";
//     const department = data.department || "N/A";
//     const type = data.type || "N/A";
//     const status = data.status || "N/A";
//     const date = data.date || data.date_created || "N/A";

//     return (
//         <Modal show={show} onHide={onHide} size="lg" centered>
//             <Modal.Header closeButton>
//                 <Modal.Title>Clearance Details</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//                 {/* Header section */}
//                 <div className="d-flex align-items-center bg-light shadow-sm border rounded mb-4 p-3">
//                     <img src={ncccLogo} alt="NCCC Logo" className="img-fluid" width="150" />
//                     <div className="flex-grow-1 text-center">
//                         <h4 className="mb-0">{data?.name || "Unnamed Clearance"}</h4>
//                     </div>
//                 </div>
//                 {/* Details section */}
//                 <div className="mb-4 p-3 border rounded shadow-sm bg-light">
//                     <div className="row justify-content-center">
//                         <div className="col-md-5 text-start">
//                             <p className="mb-1"><strong>First Name:</strong> {first_name}</p>
//                             <p className="mb-1"><strong>Middle Name:</strong> {middle_name}</p>
//                             <p className="mb-1"><strong>Last Name:</strong> {last_name}</p>
//                         </div>
//                         <div className="col-md-5 text-start">
//                             <p className="mb-1"><strong>Company:</strong> {company}</p>
//                             <p className="mb-1"><strong>Branch:</strong> {branch}</p>
//                             <p className="mb-1"><strong>Department:</strong> {department}</p>
//                             <p className="mb-1"><strong>Clearance Type:</strong> {type}</p>
//                         </div>
//                     </div>
//                     <div className="text-center mt-3">
//                         <p className="mb-0"><strong>Status:</strong> {status}</p>
//                     </div>
//                 </div>
//             </Modal.Body>
//             <Modal.Footer>
//                 <Button variant="secondary" onClick={onHide}>Close</Button>
//             </Modal.Footer>
//         </Modal>
//     );
// };

// export default ClearanceDetailsModal;
