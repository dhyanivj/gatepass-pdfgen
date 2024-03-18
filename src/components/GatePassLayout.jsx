// This page is for local PDF download

import React, { forwardRef } from "react";
import {
  Container,
  // Table,
  Form,
  Row,
  Col,
  Card,
  CardBody,
  Button,
} from "react-bootstrap";
import jsPDF from "jspdf";
import "jspdf-autotable";

const GatePassLayout = forwardRef(({ formData }, ref) => {
  // Calculate total quantity dynamically
  const totalQuantity = formData.items.reduce(
    (total, item) => total + parseInt(item.quantity, 10),
    0
  );

  const generatePDF = () => {
    const { GPNo, partyName } = formData;

    // Create a new jsPDF instance
    const pdfDoc = new jsPDF({
      orientation: "landscape",
    });

    // Call the autoTable method to generate the table in the PDF
    pdfDoc.autoTable({
      html: "#gatePassTablelayout",
      theme: "grid",
      useCss: true,
    });

    const pdfName = `${GPNo - 1}-${partyName}-GatePass.pdf`;

    // Save the PDF with a specific name
    pdfDoc.save(pdfName);
  };

  // Get today's date in 'DD-MM-YYYY' format
  const todayDate = new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("-");
  return (
    // hide for prod -- all items edit PDF table layout
    <Container>
      <Card className="my-5">
        <CardBody>
          <Form>
            <Row className="justify-content-md-center ">
              <Col>
                <table border={1} id="gatePassTablelayout">
                  <tr>
                    <td
                      rowSpan={2}
                      colSpan={4}
                      className="text-center align-middle gate-pass-cell  gatepasstext"
                    >
                      GATE PASS
                    </td>
                    <td>GP NO.</td>
                    <td colSpan={2}>{formData.GPNo - 1}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td colSpan={2}>{todayDate}</td>
                  </tr>

                  <tbody>
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center font-weight-bold gatepasstext"
                      >
                        <b>{formData.partyName}</b>
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
                    {formData.items.map((item, index) => (
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
                      <td colSpan={3}>{totalQuantity}</td>
                    </tr>
                    <tr>
                      <td rowSpan={5}>Account's approval</td>
                      <td>Delivered By</td>
                      <td
                        rowSpan={5}
                        className="text-center align-middle gate-pass-cell gatepasstext gpcomment-pdffield"
                      >
                        {formData.gpcomment}
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

                <Button
                  variant="success"
                  onClick={generatePDF}
                  ref={ref}
                  className="ml-2"
                >
                  Generate PDF
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
});

export default GatePassLayout;
