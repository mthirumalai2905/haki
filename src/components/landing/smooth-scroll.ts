"use client";

import { useEffect } from "react";
import { animate } from "motion";

let syncScroll = (value: number) => {
  window.scrollTo(0, value);
};

export function scrollToId(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const top = node.getBoundingClientRect().top + window.scrollY - 12;
  animate(window.scrollY, top, {
    duration: 0.9,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (value) => syncScroll(value),
  });
}

export function useLandingSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("landing-scroll");

    let current = window.scrollY;
    let target = window.scrollY;
    let frame = 0;

    syncScroll = (value) => {
      current = value;
      target = value;
      window.scrollTo(0, value);
    };

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const tick = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.35) current = target;
      window.scrollTo(0, current);
      if (current !== target) frame = requestAnimationFrame(tick);
      else frame = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      target = Math.max(0, Math.min(maxScroll(), target + event.deltaY));
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (frame) return;
      current = window.scrollY;
      target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove("landing-scroll");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      syncScroll = (value) => window.scrollTo(0, value);
    };
  }, []);
}
