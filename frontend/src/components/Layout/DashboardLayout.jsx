// import React, { useState } from "react";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";

// const DashboardLayout = ({ children }) => {
//   const [selected, setSelected] = useState("profile");

//   return (
//     <div className="flex h-screen">
//       <Sidebar onSelect={setSelected} />
//       <div className="flex-1 flex flex-col">
//         <Topbar title={selected === "profile" ? "My Profile" : "Dashboard"} />
//         <main className="p-6 bg-mint_green-900 flex-1 overflow-y-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;


import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-mint_green-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;