import React, { forwardRef } from "react";
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

    const pdfName = `${GPNo}-${partyName}-GatePass.pdf`;

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
    <div className="container mx-auto">
      <div className="my-5">
        <form>
          <div className="flex justify-center">
            <div className="w-full">
              <table
                className="border-collapse border w-full"
                id="gatePassTablelayout"
              >
                <thead>
                  <tr>
                    <td
                      colSpan={4}
                      rowSpan={2}
                      className="text-center align-middle gate-pass-cell gatepasstext border"
                    >
                      GATE PASS
                    </td>
                    <td>GP NO.</td>
                    <td>{formData.GPNo}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>{todayDate}</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center font-semibold gatepasstext"
                    >
                      {formData.partyName}
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
                  {formData.items.map((item, index) => (
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
                    <td>Vehicle ..............................</td>
                    <td colSpan={2}>Stamp .........</td>
                  </tr>
                </tbody>
              </table>

              <button
                type="button"
                onClick={generatePDF}
                ref={ref}
                className="bg-green-500 text-white px-4 py-2 rounded-full ml-2"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

export default GatePassLayout;
