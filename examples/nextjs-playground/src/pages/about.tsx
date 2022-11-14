import { usePageTransition } from "@bsmnt/page-transition";
import { useEffect, useRef, useState } from "react";
import { PageTemplate } from "../components/page-template";
import { gsap } from "gsap";

export default function About() {
  const { getTransitionSpace } = usePageTransition();
  const animationContainerRef = useRef<HTMLDivElement>(null);
  const [fadedIn, setFadedIn] = useState(false);

  // page transition / fade out
  useEffect(() => {
    const kill = getTransitionSpace(async () => {
      if (animationContainerRef.current) {
        await gsap.to(animationContainerRef.current, {
          opacity: 0,
          y: 50,
        });
      }
    });

    return kill;
  }, [getTransitionSpace]);

  // fade in
  useEffect(() => {
    const animationContainer = animationContainerRef.current;
    if (animationContainer) {
      const tween = gsap.to(animationContainer, {
        opacity: 1,
        y: 0,
        onComplete: () => {
          setFadedIn(true);
        },
      });

      return () => {
        tween.revert();
      };
    }
  }, []);

  return (
    <div
      ref={animationContainerRef}
      style={{
        opacity: 0,
        transform: "translateY(50px)",
      }}
    >
      <PageTemplate fadedIn={fadedIn} isAbout />
    </div>
  );
}
