import React from "react";
import { CogIcon } from "@heroicons/react/outline";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex justify-center items-center px-6 bg-white border-b h-12">
      <div className="container">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-6">
            <Link to="/" className="font-bold">
              Greenpath
            </Link>
          </div>
          <div>
            <Link to="/settings">
              <CogIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
