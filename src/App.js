import React from "react";
import GatePassForm from "./components/GatePassForm";
import GatePassLayout from "./components/GatePassLayout";
import GatePassList from "./components/GatePassList";
import { Button } from "@nextui-org/react";

const App = () => {
  return (
    <>
       <Button
        borderRadius="1.75rem"
        className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
      >
        Borders are cool
      </Button>
      <Button color="primary">Button</Button>
      {/* <h1 className="text-3xl font-bold underline">Hello world!</h1> */}
      <GatePassForm />
      <GatePassList />
      {/* <GatePassLayout/> */}
    </>
  );
};

export default App;
