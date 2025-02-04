"use client";
import React from "react";
import { ArrowRight, Zap, Shield, Leaf, BarChart3, Network, Cpu, LineChart, Lock, Globe2, Power, CheckCircle2 } from 'lucide-react';
import { motion } from "framer-motion";
import { LampContainer } from "./ui/lamp";
import HoverBorderGradientDemo from "./HoverBorderGradientDemo";
export default function LampDemo() {
  return (
    <LampContainer>
        {/* <div> */}
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        BarelyTokenized<br /> 
        <br />
        <div className=" absolute top-60 left-[26%]" >  
        <a
        href="/BarelyTokenized"
        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20"
        >
            G e t &nbsp; S t a r t e d
        <ArrowRight className="ml-2 w-5 h-5" />
        </a> </div>
      </motion.h1>
      
    {/* </div> */}
     
    </LampContainer>
  );
}
