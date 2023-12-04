import React from "react";
import { ScaleLoader } from "react-spinners";
import { colors } from "../../styles/colors";

export default function Loader() {
  return (
    <div className="flex justify-center align-middle items-center h-screen">
      <ScaleLoader color={colors.primary} />
    </div>
  );
}
