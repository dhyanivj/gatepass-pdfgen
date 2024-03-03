import React, { useState, useEffect, useRef } from "react";
import GatePassLayout from "./GatePassLayout";
import { db, storage } from "../firebase";
import Logo from "./gatepass-logo.png";
import jsPDF from "jspdf";
import { Input } from "@nextui-org/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/react";
function GatePassForm() {
  const generatePDFButtonRef = useRef(null);
  const [formInputs, setFormInputs] = useState({
    partyName: "",
    GPNo: "",
    date: "",
    items: [
      { itemName: "", packingStyle: "", quantity: "", rate: "", gst: "" },
    ],
  });

  useEffect(() => {
    // Fetch the GP number on page load
    const fetchGPNumber = async () => {
      try {
        const doc = await db
          .collection("auto-gpnumber")
          .doc("doc-gpnumber")
          .get();
        if (doc.exists) {
          const currentGPNo = doc.data().gpnumber;
          setFormInputs((prevState) => ({
            ...prevState,
            GPNo: currentGPNo,
          }));
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching GP number:", error);
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
      await db.collection("gatePasses").add({
        partyName: formInputs.partyName,
        GPNo: formInputs.GPNo,
        date: new Date(),
        items: formInputs.items,
        pdfName: `${formInputs.GPNo}-${formInputs.partyName}-GatePass.pdf`,
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
    // Reload the page after a delay to allow time for PDF download
    // setTimeout(() => {
    //   window.location.reload();
    // }, 500); // Adjust the delay as needed
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
        { itemName: "", packingStyle: "", quantity: "", rate: "", gst: "" },
      ],
    });
  };

  const removeItem = (index) => {
    const updatedItems = [...formInputs.items];
    updatedItems.splice(index, 1);
    setFormInputs({ ...formInputs, items: updatedItems });
  };

  return (
    <div className="container mx-auto">
      {/* <div className="text-center">
        <img src={Logo} alt="logo" className="logo my-5" />
      </div> */}
      <div className="flex">
        <div className="flex-1">
          <div className="my-3 gatepassform p-3">
            <form onSubmit={handleSubmit}>
              <div className="my-3">
                <Input
                  type="text"
                  label="Party Name"
                  name="partyName"
                  value={formInputs.partyName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <Input
                  type="text"
                  label="GP No."
                  isReadOnly
                  name="GPNo"
                  value={formInputs.GPNo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-4">
                <table className="w-full border">
                  <thead>
                    <tr>
                      <td className="min-w-48">Item Name</td>
                      <td className="min-w-48">Packing Style</td>
                      <td className="min-w-24">Quantity</td>
                      <td className="min-w-24">Rate</td>
                      <td className="min-w-24">GST</td>
                      <td className="min-w-24">Action</td>
                    </tr>
                  </thead>
                  <tbody>
                    {formInputs.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Input
                            type="text"
                            placeholder="Enter item name"
                            name="itemName"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            placeholder="Enter packing style"
                            name="packingStyle"
                            value={item.packingStyle}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            placeholder="Enter quantity"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            placeholder="Enter rate"
                            name="rate"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            placeholder="Enter GST"
                            name="gst"
                            value={item.gst}
                            onChange={(e) => handleItemChange(index, e)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="bg-red-500 text-white px-4 py-2 rounded-full"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full mr-2"
                >
                  Add Item
                </button>

                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-full"
                >
                  Download PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* <div className="d-none"> */}
      <GatePassLayout formData={formInputs} ref={generatePDFButtonRef} />
      {/* </div> */}
    </div>
  );
}

export default GatePassForm;
