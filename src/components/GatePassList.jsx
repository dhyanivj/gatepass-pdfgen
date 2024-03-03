import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";

function GatePassList() {
  const [gatePasses, setGatePasses] = useState([]);
  const [selectedGatePasses, setSelectedGatePasses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedGatePass, setEditedGatePass] = useState(null);
  const [editedDate, setEditedDate] = useState("");

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
      await db
        .collection("gatePasses")
        .doc(editedGatePass.id)
        .update({
          partyName: editedForm.partyName,
          GPNo: editedForm.GPNo,
          items: editedForm.items,
          date: new Date(editedDate),
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
        setGatePasses(data);

        // Fetch the initial date from Firestore for the selected gate pass
        if (editedGatePass) {
          const selectedGatePassData = data.find(
            (gatePass) => gatePass.id === editedGatePass.id
          );
          if (selectedGatePassData) {
            setEditedDate(
              selectedGatePassData.date?.toDate() || new Date().toISOString()
            );
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
  };

  const totalQuantity = editedForm.items.reduce((total, item) => {
    const parsedQuantity = parseInt(item.quantity, 10);

    // Debugging logs
    console.log("item.quantity:", item.quantity);
    console.log("parsedQuantity:", parsedQuantity);

    return total + (isNaN(parsedQuantity) ? 0 : parsedQuantity);
  }, 0);

  return (
    <div>
      <h1>Gate Pass List</h1>
      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
              <button
                className="btn btn-danger"
                onClick={handleDeleteSelected}
                style={{
                  display:
                    selectedGatePasses.length === 0 ? "none" : "inline-block",
                }}
              >
                Delete Selected
              </button>
            </th>
            <th>
              <button
                className="btn btn-link"
                onClick={() => handleSortOrderChange("GPNo")}
              >
                GP No {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </th>
            <th>
              <button
                className="btn btn-link"
                onClick={() => handleSortOrderChange("partyName")}
              >
                Party Name {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </th>
            <th>
              <button
                className="btn btn-link"
                onClick={() => handleSortOrderChange("date")}
              >
                Date {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </th>
            <th>
              <button
                className="btn btn-link"
                onClick={() => handleSortOrderChange("items")}
              >
                Items {sortOrder === "asc" ? "▲" : "▼"}
              </button>
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
                <input
                  type="checkbox"
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
                <button
                  className="btn btn-info"
                  onClick={() => openDetailsModal(gatePass)}
                >
                  View Items
                </button>
              </td>
              <td>
                <button
                  className="btn btn-success"
                  onClick={() =>
                    downloadPDF(
                      `${gatePass.GPNo}-${gatePass.partyName}-GatePass.pdf`
                    )
                  }
                >
                  Download PDF
                </button>
              </td>
              <td>
                <button
                  className="btn btn-warning"
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
                </button>
              </td>
              {/* Add edit and remark buttons and handlers */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for displaying item details */}
      <div className={selectedGatePass !== null ? "block" : "hidden"}>
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Items</h2>
              <span className="modal-close" onClick={closeDetailsModal}>
                &times;
              </span>
            </div>
            <div className="modal-body">
              {selectedGatePass && selectedGatePass.items.length > 0 ? (
                <table className="table table-striped table-bordered table-hover">
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
                </table>
              ) : (
                <p>No items available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for editing gate pass details */}
      <div className={showEditModal ? "block" : "hidden"}>
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Gate Pass</h2>
              <span
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label>Party Name</label>
                  <input
                    type="text"
                    placeholder="Enter party name"
                    name="partyName"
                    value={editedForm.partyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>GP No.</label>
                  <input
                    type="text"
                    placeholder="Enter GP No."
                    name="GPNo"
                    value={editedForm.GPNo}
                    onChange={handleInputChange}
                  />
                </div>

                <table className="table table-striped table-bordered table-hover">
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
                          <input
                            type="text"
                            placeholder="Enter item name"
                            name="itemName"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Enter packing style"
                            name="packingStyle"
                            value={item.packingStyle}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Enter quantity"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Enter rate"
                            name="rate"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Enter GST"
                            name="gst"
                            value={item.gst}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
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
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button className="btn btn-primary" onClick={handleAddItem}>
                  Add Item
                </button>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Close
              </button>
              <button className="btn btn-primary" onClick={handleEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table template start  */}
      <table border={1} id="newgatePassTable">
        <tbody>
          <tr>
            <td
              rowSpan={2}
              colSpan={4}
              className="text-center align-middle gate-pass-cell  gatepasstext"
            >
              GATE PASS
            </td>
            <td>GP NO.</td>
            <td>{editedForm.GPNo}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>
              {editedDate
                ? new Date(editedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : ""}
            </td>
          </tr>

          <tr>
            <td
              colSpan={6}
              className="text-center font-weight-bold gatepasstext"
            >
              <b>{editedForm.partyName}</b>
            </td>
          </tr>
          <tr>
            <td>S.No.</td>
            <td>Item Name</td>
            <td>Packing Style</td>
            <td>Qty.</td>
            <td>Rate</td>
            <td>GST</td>
          </tr>
          {editedForm.items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
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
            <td>{totalQuantity}</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td rowSpan={5}>Account's approval</td>
            <td>Delivered By</td>
            <td rowSpan={5}></td>
            <td rowSpan={5}>Gate approval</td>
            <td colSpan={2}>Delivered By</td>
          </tr>
          <tr>
            <td>Name ..............................</td>
            <td colSpan={2}>Name .........</td>
          </tr>
          <tr>
            <td>Phone No. ..............................</td>
            <td colSpan={2}>Phone No. .........</td>
          </tr>
          <tr>
            <td>Signature ..............................</td>
            <td colSpan={2}>Signature .........</td>
          </tr>
          <tr>
            <td>Date ..............................</td>
            <td colSpan={2}>Date .........</td>
          </tr>
          <tr>
            <td rowSpan={5}>Store Approval</td>
            <td>Accepted By</td>
            <td rowSpan={5}></td>
            <td rowSpan={5}>Store Approval</td>
            <td colSpan={2}>Accepted By</td>
          </tr>
          <tr>
            <td>Name ..............................</td>
            <td colSpan={2}>Name .........</td>
          </tr>
          <tr>
            <td>Phone No. ..............................</td>
            <td colSpan={2}>Phone No. .........</td>
          </tr>
          <tr>
            <td>Signature ..............................</td>
            <td colSpan={2}>Signature .........</td>
          </tr>
          <tr>
            <td>Date ..............................</td>
            <td colSpan={2}>Date .........</td>
          </tr>
        </tbody>
      </table>
      {/* Table template end */}
    </div>
  );
}

export default GatePassList;
