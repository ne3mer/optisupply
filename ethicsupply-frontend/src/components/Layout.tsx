import React from "react";
import { Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Outlet />
    </div>
  );
};

export default Layout;
