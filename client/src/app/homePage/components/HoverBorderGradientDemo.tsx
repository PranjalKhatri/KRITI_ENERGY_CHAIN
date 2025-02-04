"use client";
import React from "react";
import  HoverBorderGradient  from "./ui/hover-border-gradient";

export default function HoverBorderGradientDemo() {
  return (
    <div className="m-40 flex justify-center text-center absolute -top-[19%] -right-[8%]">
      <HoverBorderGradient
        containerClassName="rounded-full"
        as="button"
        className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
      >
        <span>Get Started</span>
      </HoverBorderGradient>
    </div>
  );
}
