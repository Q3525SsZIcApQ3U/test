import React, { useEffect } from "react";
import CalendarComponent from "./CalendarComponent";

const App = () => {
  useEffect(() => {
    // Prevent right-click on the entire app
    const handleRightClick = (e) => {
      e.preventDefault();
      console.log("Right-click is disabled");
    };

    // Attach event listener when the component mounts
    document.addEventListener("contextmenu", handleRightClick);

    // Clean up event listener when the component unmounts
    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>My Calendar App</h1>
        <CalendarComponent />
      </div>
  );
};

export default App;
