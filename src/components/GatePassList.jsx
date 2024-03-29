import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  Button,
  Table,
  Modal,
  Form,
  Container,
  Pagination,
} from "react-bootstrap";
import jsPDF from "jspdf";
import "jspdf-autotable";
import EditedPdfLayout from "./EditedPdfLayout";
import { Link } from "react-router-dom";

function GatePassList() {
  const [gatePasses, setGatePasses] = useState([]);
  const [selectedGatePasses, setSelectedGatePasses] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedGatePass, setEditedGatePass] = useState(null);
  const [editedDate, setEditedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page
  // const [gatePasses] = useState([...]); // Your gate passes data
  const totalPages = Math.ceil(gatePasses.length / pageSize);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const visibleGatePasses = gatePasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const [editedForm, setEditedForm] = useState({
    partyName: "",
    GPNo: "",
    gpcomment: "",
    items: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleItemChange = (index, e) => {
    const updatedItems = [...editedForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [e.target.name]: e.target.value,
    };
    setEditedForm((prevForm) => ({
      ...prevForm,
      items: updatedItems,
    }));
  };

  const handleAddItem = () => {
    setEditedForm((prevForm) => ({
      ...prevForm,
      items: [
        ...prevForm.items,
        { itemName: "", packingStyle: "", quantity: "", rate: "", gst: "" },
      ],
    }));
  };

  const handleEdit = async () => {
    try {
      // Update the gate pass details in Firestore
      await db
        .collection("gatePasses")
        .doc(editedGatePass.id)
        .update({
          partyName: editedForm.partyName,
          GPNo: editedForm.GPNo,
          items: editedForm.items,
          date: new Date(editedDate),
          comment: editedForm.gpcomment,
          // Add other fields as needed
        });

      // Generate and upload the updated PDF
      generatePDF();

      // Close the edit modal
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating gate pass details:", error);
    }
  };
  useEffect(() => {
    const fetchGatePasses = async () => {
      try {
        const snapshot = await db.collection("gatePasses").get();
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort gate passes by GP number in descending order
        const sortedGatePasses = data.sort((a, b) => b.GPNo - a.GPNo);

        setGatePasses(sortedGatePasses);

        // Fetch the initial date from Firestore for the selected gate pass
        if (editedGatePass) {
          const selectedGatePassData = sortedGatePasses.find(
            (gatePass) => gatePass.id === editedGatePass.id
          );
          if (selectedGatePassData) {
            setEditedDate(
              selectedGatePassData.date?.toDate() || new Date().toISOString()
            );

            // Fetch the delivery status directly
            const deliveryStatusSnapshot = await db
              .collection("gatePasses")
              .doc(editedGatePass.id)
              .get();
            const initialDeliveryStatus =
              deliveryStatusSnapshot.data()?.DeliveryStatus || "NotDelivered";

            setDeliveryStatus({
              [editedGatePass.id]: initialDeliveryStatus,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching gate passes:", error);
      }
    };

    fetchGatePasses();
  }, [editedGatePass]);

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedGatePasses(selectAll ? [] : [...gatePasses]);
  };

  const toggleSelectGatePass = (gatePass) => {
    if (selectedGatePasses.includes(gatePass)) {
      setSelectedGatePasses(
        selectedGatePasses.filter((selected) => selected !== gatePass)
      );
    } else {
      setSelectedGatePasses([...selectedGatePasses, gatePass]);
    }
  };

  const handleDeleteSelected = async () => {
    // Delete selected gate passes from Firestore and Storage
    try {
      const batch = db.batch();
      selectedGatePasses.forEach((gatePass) => {
        const docRef = db.collection("gatePasses").doc(gatePass.id);
        batch.delete(docRef);
      });
      await batch.commit();

      // Delete PDFs from Storage
      selectedGatePasses.forEach((gatePass) => {
        const pdfFileName = `${gatePass.GPNo}-${gatePass.partyName}-GatePass.pdf`;
        const storageRef = storage.ref();
        const pdfFileRef = storageRef.child(pdfFileName);
        pdfFileRef
          .delete()
          .catch((error) => console.error("Error deleting PDF:", error));
      });

      // Clear selected gate passes
      setSelectedGatePasses([]);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting gate passes:", error);
    }
  };

  const handleSortOrderChange = (columnName) => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedGatePasses = [...gatePasses].sort((a, b) => {
      if (columnName === "GPNo" || columnName === "date") {
        return sortOrder === "asc"
          ? a[columnName] - b[columnName]
          : b[columnName] - a[columnName];
      } else if (columnName === "partyName") {
        return sortOrder === "asc"
          ? a[columnName].localeCompare(b[columnName])
          : b[columnName].localeCompare(a[columnName]);
      } else if (columnName === "items") {
        return sortOrder === "asc"
          ? a[columnName].length - b[columnName].length
          : b[columnName].length - a[columnName].length;
      }
      return 0;
    });

    setGatePasses(sortedGatePasses);
  };

  const openDetailsModal = (gatePass) => {
    setSelectedGatePass(gatePass);
  };

  const closeDetailsModal = () => {
    setSelectedGatePass(null);
  };

  const downloadPDF = async (pdfFileName) => {
    // Download PDF from Firebase Storage
    const storageRef = storage.ref();
    const pdfFileRef = storageRef.child(pdfFileName);

    try {
      const downloadURL = await pdfFileRef.getDownloadURL();
      window.open(downloadURL, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };
  const generatePDF = () => {
    // Create a new jsPDF instance
    const pdfDoc = new jsPDF({
      orientation: "landscape",
    });

    pdfDoc.autoTable({
      html: "#newgatePassTable",
      theme: "grid",
      useCss: true,
    });

    // Save the PDF to Firebase Storage
    const pdfFileName = `${editedForm.GPNo}-${editedForm.partyName}-GatePass.pdf`;
    const storageRef = storage.ref();
    const pdfFileRef = storageRef.child(pdfFileName);

    // Convert the PDF to a Blob
    const pdfBlob = pdfDoc.output("blob");

    // Upload the Blob to Firebase Storage
    pdfFileRef.put(pdfBlob).then(() => {
      console.log("PDF uploaded to Firebase Storage");
    });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  const handleDeliveryStatusChange = async (gatePassId, newStatus) => {
    try {
      // Update the gate pass delivery status in Firestore
      await db.collection("gatePasses").doc(gatePassId).update({
        DeliveryStatus: newStatus,
      });

      // Update the local state with the new delivery status
      setDeliveryStatus({
        ...deliveryStatus,
        [gatePassId]: newStatus,
      });
    } catch (error) {
      console.error("Error updating delivery status:", error);
    }
  };
  const downloadPackingSlip = async (gatePass) => {
    try {
      // Create a new jsPDF instance
      const pdfDoc = new jsPDF({
        orientation: "landscape",
      });

      // Add packing slip content to the PDF using autoTable
      pdfDoc.autoTable({
        html: `#packingslipLayout-${gatePass.id}`,

        theme: "grid",
        useCss: true,
      });

      // Save the PDF with a specific name
      const pdfFileName = `${gatePass.GPNo}-${gatePass.partyName}-PackingSlip.pdf`;

      // Download the PDF
      pdfDoc.save(pdfFileName);
    } catch (error) {
      console.error("Error generating packing slip:", error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between p-2">
        <h3>Gate Pass List</h3>
        <Link to="/">
          <button className="btn btn-primary rounded">
            <i class="fa fa-plus mr-2"></i>
            <span> Add Gate Pass</span>
          </button>
        </Link>
      </div>
      <Container fluid>
        <Table striped bordered hover responsive>
          <thead>
            <tr className="gplist-header">
              <th>
                <div className="d-flex">
                  <Form.Check
                    type="checkbox"
                    label=""
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                  <Button
                    variant="danger"
                    onClick={handleDeleteSelected}
                    style={{
                      display:
                        selectedGatePasses.length === 0
                          ? "none"
                          : "inline-block",
                    }}
                  >
                    <i class="fa fa-trash"></i>
                  </Button>
                </div>
              </th>
              <th>
                <Button
                  variant="link"
                  onClick={() => handleSortOrderChange("GPNo")}
                >
                  GP No {sortOrder === "asc" ? "▲" : "▼"}
                </Button>
              </th>
              <th>
                <Button
                  variant="link"
                  onClick={() => handleSortOrderChange("partyName")}
                >
                  Party Name {sortOrder === "asc" ? "▲" : "▼"}
                </Button>
              </th>
              <th>
                <Button
                  variant="link"
                  onClick={() => handleSortOrderChange("date")}
                >
                  Date {sortOrder === "asc" ? "▲" : "▼"}
                </Button>
              </th>
              <th>
                <Button
                  variant="link"
                  onClick={() => handleSortOrderChange("items")}
                >
                  Items {sortOrder === "asc" ? "▲" : "▼"}
                </Button>
              </th>

              <th>PDF Download</th>
              <th>Packing Slip</th>
              <th>Edit</th>
              <th style={{ minWidth: "8rem" }}>Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleGatePasses.map((gatePass) => (
              <tr key={gatePass.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    label=""
                    checked={selectedGatePasses.includes(gatePass)}
                    onChange={() => toggleSelectGatePass(gatePass)}
                  />
                </td>
                <td>{gatePass.GPNo}</td>
                <td>{gatePass.partyName}</td>
                <td>
                  {gatePass.date instanceof Date
                    ? gatePass.date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : gatePass.date?.toDate()?.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                </td>
                <td>
                  <Button
                    variant="info"
                    onClick={() => openDetailsModal(gatePass)}
                  >
                    View Items
                  </Button>
                </td>
                <td>
                  <Button
                    variant="success"
                    onClick={() =>
                      downloadPDF(
                        `${gatePass.GPNo}-${gatePass.partyName}-GatePass.pdf`
                      )
                    }
                  >
                    Download PDF
                  </Button>
                </td>
                <td>
                  {" "}
                  <button
                    className="btn btn-primary"
                    onClick={() => downloadPackingSlip(gatePass)}
                  >
                    Download Packing Slip
                  </button>
                </td>
                <td>
                  <Button
                    variant="warning"
                    onClick={() => {
                      setEditedGatePass(gatePass);
                      setEditedForm({
                        partyName: gatePass.partyName,
                        GPNo: gatePass.GPNo,
                        gpcomment: gatePass.comment,
                        items: [...gatePass.items],
                        // here we will fetch the details from db
                      });
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </td>

                <td>
                  <td>
                    {/* Delivery status dropdown */}
                    <select
                      className="form-select"
                      aria-label="Delivery status"
                      value={deliveryStatus[gatePass.id]}
                      onChange={(e) =>
                        handleDeliveryStatusChange(gatePass.id, e.target.value)
                      }
                    >
                      <option
                        value="NotDelivered"
                        selected={gatePass.DeliveryStatus === "NotDelivered"}
                      >
                        Pending
                      </option>
                      <option
                        value="Delivered"
                        selected={gatePass.DeliveryStatus === "Delivered"}
                      >
                        Delivered
                      </option>
                    </select>
                  </td>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="d-flex justify-content-center my-2">
          <Pagination>
            <Pagination.First onClick={() => handlePageChange(1)} />
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} />
          </Pagination>
        </div>
      </Container>

      {/* Modal for displaying item details */}
      <Modal show={selectedGatePass !== null} onHide={closeDetailsModal}>
        <Modal.Header closeButton>
          <Modal.Title>Items</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGatePass && selectedGatePass.items.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Packing Style</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>GST</th>
                </tr>
              </thead>
              <tbody>
                {selectedGatePass.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.itemName}</td>
                    <td>{item.packingStyle}</td>
                    <td>{item.quantity}</td>
                    <td>{item.rate}</td>
                    <td>{item.gst}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No items available.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal for editing gate pass details */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Gate Pass</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formPartyName">
              <Form.Label>Party Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter party name"
                name="partyName"
                value={editedForm.partyName}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formDate">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="gpcomment">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter comment"
                name="gpcomment"
                value={editedForm.gpcomment}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formGPNo">
              <Form.Label>GP No.</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter GP No."
                name="GPNo"
                value={editedForm.GPNo}
                onChange={handleInputChange}
                readOnly
              />
            </Form.Group>

            <Table striped bordered responsive>
              <thead>
                <tr>
                  <th>Box Number</th>
                  <th>Item Name</th>
                  <th>Packing Style</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>GST</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {editedForm.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter box name"
                        name="boxnumber"
                        value={item.boxnumber}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter item name"
                        name="itemName"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter packing style"
                        name="packingStyle"
                        value={item.packingStyle}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter quantity"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter rate"
                        name="rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Enter GST"
                        name="gst"
                        value={item.gst}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const updatedItems = [...editedForm.items];
                          updatedItems.splice(index, 1);
                          setEditedForm((prevForm) => ({
                            ...prevForm,
                            items: updatedItems,
                          }));
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Button variant="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Table templete start  */}
      <div className="d-none">
        <EditedPdfLayout editedForm={editedForm} editedDate={editedDate} />
      </div>

      {/* ------------------ statrt ------------- */}
      <div className="d-none">
        {gatePasses.map((gatePass) => (
          <div className="d-none packingslipLayout" key={gatePass.id}>
            <table border={1} id={`packingslipLayout-${gatePass.id}`}>
              <tr>
                <td
                  rowSpan={2}
                  colSpan={4}
                  className="text-center align-middle gate-pass-cell  gatepasstext"
                >
                  PACKING SLIP
                </td>
                <td>PS NO.</td>
                <td colSpan={2}>{gatePass.GPNo}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td colSpan={2}>
                  {gatePass.date instanceof Date
                    ? gatePass.date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : gatePass.date?.toDate()?.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                </td>
              </tr>

              <tbody>
                <tr>
                  <td
                    colSpan={7}
                    className="text-center font-weight-bold gatepasstext"
                  >
                    <b>{gatePass.partyName}</b>
                  </td>
                </tr>
                <tr>
                  <td>S.No.</td>
                  <td>Box Number</td>
                  <td>Item Name</td>
                  <td>Packing Style</td>
                  <td>Qty.</td>
                  <td>Rate</td>
                  <td>GST</td>
                </tr>
                {gatePass.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.boxnumber}</td>
                    <td>{item.itemName}</td>
                    <td>{item.packingStyle}</td>
                    <td>{item.quantity}</td>
                    <td>{item.rate}</td>
                    <td>{item.gst}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}></td>
                  <td>Total</td>
                  <td></td>
                  {/* total quantity */}
                  <td colSpan={3}>
                    {gatePass.items.reduce(
                      (total, item) => total + parseInt(item.quantity || 0),
                      0
                    )}
                  </td>
                </tr>
                <tr>
                  <td rowSpan={5}>Account's approval</td>
                  <td>Delivered By</td>
                  <td
                    rowSpan={5}
                    className="text-center align-middle gate-pass-cell gatepasstext gpcomment-pdffield"
                  >
                    {gatePass.comment}
                  </td>
                  <td rowSpan={5}>Gate approval</td>
                  <td colSpan={3}>Received By</td>
                </tr>
                <tr>
                  <td>Name .......</td>
                  <td colSpan={3}>Name ......................</td>
                </tr>
                <tr>
                  <td>Phone No. ..............</td>
                  <td colSpan={3}>Phone No. .........</td>
                </tr>
                <tr>
                  <td>Signature .............</td>
                  <td colSpan={3}>Signature .........</td>
                </tr>
                <tr>
                  <td>Vehicle ........</td>
                  <td colSpan={3}>Stamp .........</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {/* ------------------ ENd ------------- */}
    </div>
  );
}

export default GatePassList;
