import React from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-[85vh]">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;
