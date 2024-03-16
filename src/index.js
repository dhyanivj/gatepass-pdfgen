import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
    createBrowserRouter,
    RouterProvider,
  } from "react-router-dom";
import GatePassForm from "./components/GatePassForm";
import GatePassList from "./components/GatePassList";

  const router = createBrowserRouter([
    {
      path: "/",
      element: <GatePassForm/>,
    },
    {
      path: "/gatepasslist",
      element: <GatePassList/>,
    },
  ]);
 ReactDOM.createRoot(document.getElementById("root")).render(
      <RouterProvider router={router} />
  );;
