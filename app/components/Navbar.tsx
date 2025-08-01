"use client";
import Image from "next/image";
import { useState } from "react";

import navicon1 from "../assets/logo-pokemon-79x45.png";
import navicon2 from "../assets/logo-pokemoncenter-79x45.png";
import navicon3 from "../assets/corporate-en.png";
import navicon4 from "../assets/swsh12-gus-175-en.jpg";
import navicon5 from "../assets/scarlet-violet-175x50-en.jpg";
import navicon6 from "../assets/unite-176x50.jpg";

const navItems = [
  { id: 0, src: navicon1 },
  { id: 1, src: navicon2 },
  { id: 2, src: navicon3 },
  { id: 3, src: navicon4 },
  { id: 4, src: navicon5 },
  { id: 5, src: navicon6 },
];

const Navbar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="flex justify-center items-center gap-1 p-2 border-b-2 border-[#dedede] bg-[#f5f5f5]">
        {navItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setActiveIndex(index)}
            className={`cursor-pointer p-1 ${
              activeIndex === index ? "active" : ""
            }`}
          >
            <Image src={item.src} alt={`nav-icon-${index}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
