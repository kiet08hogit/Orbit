"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { User, Code, GraduationCap, FileText, Briefcase, Truck, MessageCircle } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-black dark:border-[#333] dark:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

export function AnimatedBeamHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null); // input (user)
  const div2Ref = useRef<HTMLDivElement>(null); // center (orbit)
  const div3Ref = useRef<HTMLDivElement>(null); // output 1
  const div4Ref = useRef<HTMLDivElement>(null); // output 2
  const div5Ref = useRef<HTMLDivElement>(null); // output 3
  const div6Ref = useRef<HTMLDivElement>(null); // output 4
  const div7Ref = useRef<HTMLDivElement>(null); // output 5
  const div8Ref = useRef<HTMLDivElement>(null); // output 6

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden p-4"
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center">
          <Circle ref={div1Ref} className="size-16">
            <User className="text-black dark:text-white" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div2Ref} className="size-24 bg-transparent border-none p-0 overflow-hidden shadow-none">
            <img src="/Orbit_logo_transparent.png" alt="Orbit" className="w-full h-full object-contain" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={div3Ref}>
            <Code className="text-black dark:text-white" />
          </Circle>
          <Circle ref={div4Ref}>
            <GraduationCap className="text-black dark:text-white" />
          </Circle>
          <Circle ref={div5Ref}>
            <FileText className="text-black dark:text-white" />
          </Circle>
          <Circle ref={div6Ref}>
            <Briefcase className="text-black dark:text-white" />
          </Circle>
          <Circle ref={div7Ref}>
            <Truck className="text-black dark:text-white" />
          </Circle>
          <Circle ref={div8Ref}>
            <MessageCircle className="text-black dark:text-white" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div3Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div5Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div6Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div7Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div8Ref}
        pathColor="rgba(156, 163, 175, 0.2)"
        pathOpacity={1}
      />
    </div>
  );
}
