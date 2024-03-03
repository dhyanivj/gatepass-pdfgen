import React from "react";

const EditedPdfLayout = ({ editedForm, editedDate }) => {
  const totalQuantity = editedForm.items.reduce((total, item) => {
    const parsedQuantity = parseInt(item.quantity, 10);

    // Debugging logs
    console.log("item.quantity:", item.quantity);
    console.log("parsedQuantity:", parsedQuantity);

    return total + (isNaN(parsedQuantity) ? 0 : parsedQuantity);
  }, 0);

  return (
    <table border={1} id="newgatePassTable">
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

      <tbody>
        <tr>
          <td colSpan={6} className="text-center font-weight-bold gatepasstext">
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
          <td>Vehicle ..............................</td>
          <td colSpan={2}>Stamp .........</td>
        </tr>
      </tbody>
    </table>
  );
};

export default EditedPdfLayout;
