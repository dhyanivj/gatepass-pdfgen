import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Table, Container, Row, Col } from "react-bootstrap";
import GatePassLayout from "./GatePassLayout";
import { db, storage } from "../firebase"; // Import the Firestore instance
import Logo from "./gatepass-logo.png";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";

function GatePassForm() {
  const generatePDFButtonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [gpNumber, setGPNumber] = useState("");

  const [formInputs, setFormInputs] = useState({
    partyName: "",
    GPNo: "", // Use GPNo from state
    date: "",
    gpcomment:"",
    items: [
      { itemName: "", packingStyle: "", quantity: "", rate: "", gst: "" },
    ],
  });

  useEffect(() => {
    // Set up a real-time listener for GP number
    const unsubscribe = db
      .collection("auto-gpnumber")
      .doc("doc-gpnumber")
      .onSnapshot((doc) => {
        if (doc.exists) {
          const currentGPNo = doc.data().gpnumber;
          setGPNumber(currentGPNo);
          setFormInputs((prevState) => ({
            ...prevState,
            GPNo: currentGPNo,
          }));
        } else {
          console.log("No such document!");
        }
      });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs({ ...formInputs, [name]: value });
  };

  const handleSubmit = async (e) => {
    setLoading(true); 
    e.preventDefault();

    // Increment GP number locally before updating in Firestore
    const updatedGPNo = parseInt(formInputs.GPNo) + 1;
    // Update GP No. in Firestore
    try {
      await db.collection("gatePasses").add({
        partyName: formInputs.partyName,
        GPNo: formInputs.GPNo,
        date: new Date(),
        items: formInputs.items,
        pdfName: `${formInputs.GPNo}-${formInputs.partyName}-GatePass.pdf`,
        DeliveryStatus: "NotDelivered",
        comment: formInputs.gpcomment,
        // Add other data as needed
      });

      await db.collection("auto-gpnumber").doc("doc-gpnumber").update({
        gpnumber: updatedGPNo,
      });

      console.log("Data stored in Firestore");
    } catch (error) {
      console.error("Error storing data in Firestore:", error);
    }

    // Generate PDF
    generatePDF();
    setLoading(false);
    // Reload the page after a delay to allow time for PDF download
    // setTimeout(() => {
    //   window.location.reload();
    // }, 1000); // Adjust the delay as needed
  };

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: "landscape",
    });
    // pdf.text("Gate Pass Form", 15, 15);
    // Add more content to the PDF as needed based on your layout
    pdf.autoTable({
      html: "#gatePassTablelayout",
      theme: "grid",
      useCss: true,
    });
    // Save PDF to Firebase Storage
    const pdfBlob = pdf.output("blob");
    const storageRef = storage.ref();
    const pdfFileName = `${formInputs.GPNo}-${formInputs.partyName}-GatePass.pdf`;
    const pdfFileRef = storageRef.child(pdfFileName);

    try {
      // Upload the PDF blob to Firebase Storage
      await pdfFileRef.put(pdfBlob);
      console.log("PDF uploaded to Firebase Storage");

      // Trigger the "Generate PDF" button click in GatePassLayout
      if (generatePDFButtonRef.current) {
        generatePDFButtonRef.current.click();
      }
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
    }
  };

  const handleItemChange = (index, e) => {
    const updatedItems = formInputs.items.map((item, i) => {
      if (i === index) {
        return { ...item, [e.target.name]: e.target.value };
      }
      return item;
    });
    setFormInputs({ ...formInputs, items: updatedItems });
  };

  const addItem = () => {
    setFormInputs({
      ...formInputs,
      items: [
        ...formInputs.items,
        {
          itemName: "",
          packingStyle: "",
          quantity: "",
          rate: "",
          gst: "",
          gpComment:"",
        },
      ],
    });
  };

  const removeItem = (index) => {
    const updatedItems = [...formInputs.items];
    updatedItems.splice(index, 1);
    setFormInputs({ ...formInputs, items: updatedItems });
  };

  return (
    <Container>
      <div className="text-center">
        <img src={Logo} alt="logo" className="logo my-5" />
      </div>
      <Row>
        <Col>
          <div className="my-3 gatepassform p-3">
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formPartyName">
                <Form.Label>Party Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter party name"
                  name="partyName"
                  value={formInputs.partyName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formGPNo" className="mt-2">
                <Form.Label>GP No.</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter GP No."
                  name="GPNo"
                  value={gpNumber}
                  readOnly
                />
              </Form.Group>
              <Form.Group controlId="gpcomment" className="mt-2">
                <Form.Label>Comment</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Comment"
                  name="gpcomment"
                  value={formInputs.gpcomment}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Table striped responsive bordered className="mt-2">
                <thead>
                  <tr>
                    <td style={{ minWidth: "12rem" }}>Item Name</td>
                    <td style={{ minWidth: "12rem" }}>Packing Style</td>
                    <td style={{ minWidth: "6rem" }}>Quantity</td>
                    <td style={{ minWidth: "6rem" }}>Rate</td>
                    <td style={{ minWidth: "6rem" }}>GST</td>
                    <td style={{ minWidth: "6rem" }}>Action</td>
                  </tr>
                </thead>
                <tbody>
                  {formInputs.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Enter item name"
                          name="itemName"
                          required
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
                          onClick={() => removeItem(index)}
                          className="rounded-pill"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="mx-auto text-center p-2">
                <Button
                  variant="primary"
                  onClick={addItem}
                  className="m-2 rounded-pill"
                >
                  Add Item
                </Button>

                <Button
                  variant="success"
                  type="submit"
                  className="ml-2 rounded-pill"
                >
                
                {loading && (
        <div className="spinner-border text-white downloading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
                  Download PDF
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>

      <div className="text-center mb-3">
        <Link to="/gatepasslist">
          <button className="btn btn-primary rounded">Gate Pass List</button>
        </Link>
      </div>
      <div className="d-none">
        <GatePassLayout formData={formInputs} ref={generatePDFButtonRef} />
      </div>
    </Container>
  );
}

export default GatePassForm;
