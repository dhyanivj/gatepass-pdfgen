import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import GatePassForm from "./components/GatePassForm";
import GatePassList from "./components/GatePassList";

const correctPasscode = "1234";

// LoginForm component for passcode authentication
const LoginForm = ({ setAuthenticated }) => {
    const [passcode, setPasscode] = useState("");

    const handleLogin = () => {
        if (passcode === correctPasscode) {
            setAuthenticated(true);
            const expirationTime = new Date().getTime() + 600000; // 10 minutes expiry
            localStorage.setItem("authenticated", JSON.stringify({ value: true, expires: expirationTime }));
        } else {
            alert("Incorrect passcode. Please try again.");
        }
    };

    useEffect(() => {
        const authenticatedData = localStorage.getItem("authenticated");
        if (authenticatedData) {
            const { value, expires } = JSON.parse(authenticatedData);
            if (new Date().getTime() < expires) {
                setAuthenticated(value);
            } else {
                localStorage.removeItem("authenticated"); // Clear expired authentication data
            }
        }
    },); // Run once on component mount

    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow text-center" style={{ width: "300px" }}>
          <div className="card-body">
              <h2 className="card-title text-center mb-3">Enter Passcode</h2>
              <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="form-control mb-3"
              />
              <button onClick={handleLogin} className="btn btn-primary btn-block">Login</button>
          </div>
      </div>
  </div>

    );
};

const App = () => {
    const [authenticated, setAuthenticated] = useState(false);

    const router = createBrowserRouter([
        {
            path: "/",
            element: authenticated ? <GatePassForm /> : <LoginForm setAuthenticated={setAuthenticated} />,
        },
        {
            path: "/gatepasslist",
            element: <GatePassList />,
        },
    ]);

    return <RouterProvider router={router} />;
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
