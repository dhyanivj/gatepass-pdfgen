import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Table, Container, Row, Col, Card, CardBody } from 'react-bootstrap';
import GatePassLayout from './GatePassLayout';
import { db } from '../firebase'; // Import the Firestore instance

function GatePassForm() {
  const generatePDFButtonRef = useRef(null);
  const [formInputs, setFormInputs] = useState({
    partyName: '',
    GPNo: '', // Use GPNo from state
    date: '',
    items: [
      { itemName: '', packingStyle: '', quantity: '', rate: '', gst: '' },
    ],
  });

  useEffect(() => {
    // Fetch the GP number on page load
    const fetchGPNumber = async () => {
      try {
        const doc = await db.collection('auto-gpnumber').doc('doc-gpnumber').get();
        if (doc.exists) {
          const currentGPNo = doc.data().gpnumber;
          setFormInputs(prevState => ({
            ...prevState,
            GPNo: currentGPNo
          }));
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching GP number:', error);
      }
    };

    fetchGPNumber();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs({ ...formInputs, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Increment GP number locally before updating in Firestore
    const updatedGPNo = parseInt(formInputs.GPNo) + 1;

    // Update GP No. in Firestore
    try {
      await db.collection('gatePasses').add({
        partyName: formInputs.partyName,
        GPNo: updatedGPNo,
        date: new Date(),
        // Add other data as needed
      });

      await db.collection('auto-gpnumber').doc('doc-gpnumber').update({
        gpnumber: updatedGPNo,
      });

      console.log('Data stored in Firestore');
    } catch (error) {
      console.error('Error storing data in Firestore:', error);
    }

    // Generate PDF
    generatePDF();
  };

  const generatePDF = () => {
    // You can implement PDF generation here if needed
    // Example: Trigger the "Generate PDF" button click in GatePassLayout
    if (generatePDFButtonRef.current) {
      generatePDFButtonRef.current.click();
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
              <Form onSubmit={handleSubmit}>
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

                <Form.Group controlId="formGPNo">
                  <Form.Label>GP No.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter GP No."
                    name="GPNo"
                    value={formInputs.GPNo}
                    onChange={handleInputChange}
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

                <Button variant="success" type="submit" className="ml-2">
                  Submit
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
