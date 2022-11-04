import gsap from "gsap";
import { DependencyList, useRef } from "react";

import { useIsoLayoutEffect } from "./use-iso-layout-effect";

export const useGsapFrame = (
  callback: gsap.TickerCallback,
  deps: DependencyList
) => {
  const ref = useRef(callback);

  useIsoLayoutEffect(() => void (ref.current = callback), [callback]);

  useIsoLayoutEffect(() => {
    gsap.ticker.add(callback);

    return () => gsap.ticker.remove(callback);
  }, deps);

  return null;
};
