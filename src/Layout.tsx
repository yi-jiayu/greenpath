import Navbar from "./Navbar";
import React, { ReactNode } from "react";

interface LayoutProps {
  title?: string;
  children?: ReactNode;
}

const Layout = ({ title, children }: LayoutProps) => {
  return (
    <div>
      <Navbar />
      <div className="flex justify-center p-6">
        <div className="container grid gap-y-6">
          {title && <h1 className="font-bold text-4xl">{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
