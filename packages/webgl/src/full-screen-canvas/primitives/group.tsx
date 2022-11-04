import { ResizeObserver } from "@juggle/resize-observer";
import type { MeshProps } from "@react-three/fiber";
import gsap from "gsap";
import {
  forwardRef,
  isValidElement,
  MutableRefObject,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { mergeRefs } from "../../merge-refs";
import type { Object3D } from "three";

import { useWorld } from "../../hooks/use-world";

/* WARNING: This sets the WebGL child size with the scale property, so make
            sure your children elements have a dimension of 1 on the
            horizontal axes. Otherwise the target size will be wrong.
*/

export type PositionedGroupProps = {
  shadowRef: MutableRefObject<HTMLDivElement | null>;
  children: ReactNode | ((meshRef: RefObject<MeshProps>) => JSX.Element);
  noScale?: boolean;
  stick?: boolean;
};

export const PositionedGroup = forwardRef<Object3D, PositionedGroupProps>(
  ({ shadowRef, noScale = false, stick = false, children }, ref) => {
    const objRef = useRef<Object3D>(null);
    const { fromBoundingRect } = useWorld();

    const forwardRef = useMemo(
      () => typeof children === "function" && !isValidElement(children),
      [children]
    );

    useEffect(() => {
      if (!shadowRef.current) return;

      const placeGroup = () => {
        if (!shadowRef.current || !objRef.current) return;

        const { width, height, left, top } =
          shadowRef.current.getBoundingClientRect();

        const bounds = fromBoundingRect({
          top: top + window.scrollY,
          left,
          width,
          height,
        });

        objRef.current.position.x = bounds.position.x;
        objRef.current.position.y = bounds.position.y;

        if (!noScale) {
          objRef.current.scale.x = bounds.size.width;
          objRef.current.scale.y = bounds.size.height;
        }
      };

      const observer = new ResizeObserver(placeGroup);
      observer.observe(shadowRef.current);

      if (stick) gsap.ticker.add(placeGroup, false, true);

      placeGroup();

      if (objRef.current) {
        objRef.current.visible = true;
      }

      return () => {
        observer.disconnect();
        gsap.ticker.remove(placeGroup);
      };
    }, [forwardRef, shadowRef, noScale, fromBoundingRect, stick]);

    return (
      <group
        visible={!forwardRef ? false : undefined}
        ref={forwardRef ? undefined : mergeRefs([ref, objRef])}
      >
        {/* @ts-ignore */}
        {forwardRef ? children(mergeRefs([ref, objRef])) : children}
      </group>
    );
  }
);
