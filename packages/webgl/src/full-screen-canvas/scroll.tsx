import { RootState, useThree } from "@react-three/fiber";
import type { DomEvent } from "@react-three/fiber/dist/declarations/src/core/events";
import React, { useEffect, useRef } from "react";
import type { Group } from "three";

import { useGsapFrame } from "../hooks/use-gsap-frame";
import { useWorld } from "../hooks/use-world";

export const Scroll = ({ children }: { children?: React.ReactNode }) => {
  const groupRef = useRef<Group>(null);
  const { events, setEvents } = useThree();
  const scrollElmRef = useRef<HTMLElement>();
  const { fromBoundingRect } = useWorld();

  useEffect(() => {
    scrollElmRef.current = document.body;

    requestAnimationFrame(() => events.connect?.(scrollElmRef.current));

    setEvents({
      compute(event: DomEvent, state: RootState) {
        const offsetX =
          event.clientX - (scrollElmRef.current as HTMLElement).offsetLeft;
        const offsetY =
          event.clientY - (scrollElmRef.current as HTMLElement).offsetTop;
        state.pointer.set(
          (offsetX / state.size.width) * 2 - 1,
          -(offsetY / state.size.height) * 2 + 1
        );
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });
  }, [events, setEvents]);

  useGsapFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.y = fromBoundingRect({
      height: window.scrollY,
    }).size.height;
  }, [fromBoundingRect]);

  return <group ref={groupRef}>{children}</group>;
};
