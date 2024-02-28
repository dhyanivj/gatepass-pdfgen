import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { Button, Table, Modal, Form } from "react-bootstrap";

function GatePassList() {
  const [gatePasses, setGatePasses] = useState([]);
  const [selectedGatePasses, setSelectedGatePasses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedGatePass, setEditedGatePass] = useState(null);
  const [editedForm, setEditedForm] = useState({
    partyName: "",
    GPNo: "",
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
      await db.collection("gatePasses").doc(editedGatePass.id).update({
        partyName: editedForm.partyName,
        GPNo: editedForm.GPNo,
        items: editedForm.items,
        // Add other fields as needed
      });

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
        setGatePasses(data);
      } catch (error) {
        console.error("Error fetching gate passes:", error);
      }
    };

    fetchGatePasses();
  }, []);

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
  const generateUpdatedPDF = async (gatePass) => {
    const updatedPdfFileName = `${gatePass.GPNo}-${gatePass.partyName}-GatePass.pdf`;
    // const pdfBlob = await generatePDFBlob(); // Your existing generatePDF logic
    const storageRef = storage.ref();
    const pdfFileRef = storageRef.child(updatedPdfFileName);

    try {
      // Upload the updated PDF blob to Firebase Storage
      await pdfFileRef.put(pdfBlob);
      console.log("Updated PDF uploaded to Firebase Storage");

      // Update the PDF filename in Firestore
      await db.collection("gatePasses").doc(gatePass.id).update({
        pdfFileName: updatedPdfFileName,
      });

      console.log("PDF filename updated in Firestore");
    } catch (error) {
      console.error("Error uploading updated PDF to Firebase Storage:", error);
    }
  };

  return (
    <div>
      <h1>Gate Pass List</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>
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
                    selectedGatePasses.length === 0 ? "none" : "inline-block",
                }}
              >
                Delete Selected
              </Button>
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
            <th>Edit</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {gatePasses.map((gatePass) => (
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
                  : gatePass.date.toDate().toLocaleDateString("en-GB", {
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
                <Button
                  variant="warning"
                  onClick={() => {
                    setEditedGatePass(gatePass);
                    setEditedForm({
                      partyName: gatePass.partyName,
                      GPNo: gatePass.GPNo,
                      items: [...gatePass.items],
                    });
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </Button>
              </td>
              {/* Add edit and remark buttons and handlers */}
            </tr>
          ))}
        </tbody>
      </Table>

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
      {/* Modal for editing gate pass details */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
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

            <Form.Group controlId="formGPNo">
              <Form.Label>GP No.</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter GP No."
                name="GPNo"
                value={editedForm.GPNo}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Table striped bordered responsive>
              <thead>
                <tr>
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
    </div>
  );
}

export default GatePassList;