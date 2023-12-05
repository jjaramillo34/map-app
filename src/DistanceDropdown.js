import React from "react";

const DistanceDropdown = () => {
  return (
    <select>
      {[1, 2, 3, 4, 5].map((km) => (
        <option key={km} value={km}>
          {km} km
        </option>
      ))}
    </select>
  );
};

export default DistanceDropdown;
