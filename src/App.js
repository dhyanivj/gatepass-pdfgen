import React from "react";
import { Button } from "react-bootstrap";
import GatePassForm from "./components/GatePassForm";
import GatePassLayout from "./components/GatePassLayout";
import GatePassList from "./components/GatePassList";

const App = () => {
  return (
    <>
      <GatePassForm />
      <GatePassList />
      {/* <GatePassLayout/> */}
    </>
  );
};

export default App;
