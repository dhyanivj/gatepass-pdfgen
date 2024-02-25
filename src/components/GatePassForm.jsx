import React, { useState, useRef } from 'react';
import { Form, Button, Table, Container, Row, Col, Card, CardBody } from 'react-bootstrap';
import GatePassLayout from './GatePassLayout';  // Import the GatePassLayout component

function GatePassForm() {

  // Ref for the Generate PDF button in GatePassLayout
  const generatePDFButtonRef = useRef(null);

  const generatePDF = () => {
    // Increment the S.No. before triggering the click
    setFormInputs((prevInputs) => ({
      ...prevInputs,
      SNo: prevInputs.SNo + 1,
    }));

    // Trigger the "Generate PDF" button click in GatePassLayout
    if (generatePDFButtonRef.current) {
      generatePDFButtonRef.current.click();
    }
  };

  const [formInputs, setFormInputs] = useState({
    partyName: '',
    SNo: 201, // Starting Value
    date: '',
    items: [
      { itemName: '', packingStyle: '', quantity: '', rate: '', gst: '' },
    ],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs({ ...formInputs, [name]: value });
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
        { itemName: '', packingStyle: '', quantity: '', rate: '', gst: '' },
      ],
    });
  };

  return (
    <Container>
      <Row>
        <Col>
          <Card className='my-3 shadow'>
            <CardBody>
              <Form>
                <Form.Group controlId="formPartyName">
                  <Form.Label>Party Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter party name"
                    name="partyName"
                    value={formInputs.partyName}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group controlId="formSNo">
                  <Form.Label>SR. No.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter S.No."
                    name="SNo"
                    value={formInputs.SNo}
                    onChange={handleInputChange}
                    // readOnly
                  />
                </Form.Group>

                <Table striped responsive bordered hover className='mt-2'>
              <thead>
                <tr>
                  <td style={{ minWidth: '12rem' }}>Item Name</td>
                  <td style={{ minWidth: '12rem' }}>Packing Style</td>
                  <td style={{ minWidth: '6rem' }}>Quantity</td>
                  <td style={{ minWidth: '6rem' }}>Rate</td>
                  <td style={{ minWidth: '6rem' }}>GST</td>
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
                  </tr>
                ))}
              </tbody>
            </Table>

                <Button variant="primary" onClick={addItem} className='m-2'>
                  Add Item
                </Button>

                <Button variant="success" onClick={generatePDF} className="ml-2">
                  Generate PDF
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <div className="d-none">
        <GatePassLayout formData={formInputs} ref={generatePDFButtonRef} />
      </div>
    </Container>
  );
}

export default GatePassForm;
