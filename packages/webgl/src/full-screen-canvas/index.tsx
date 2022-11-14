import { Canvas as R3FCanvas, RootState } from "@react-three/fiber";
import { useContextBridge } from "@react-three/drei";

import tunnel from "tunnel-rat";
import { Scroll } from "./scroll";
import { ComponentProps, useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { gsap } from "gsap";

const scrollTunnel = tunnel();
const noScrollTunnel = tunnel();

type CanvasProps = Omit<ComponentProps<typeof R3FCanvas>, "children"> & {
  onUnmount?: () => void;
  forwardContext?: any[];
  debug?: boolean;
  children?: React.ReactNode;
};

export const FullScreenCanvas = ({
  onCreated,
  onUnmount,
  forwardContext = [],
  debug = false,
  children,
  ...rest
}: CanvasProps) => {
  const ContextBridge = useContextBridge(/*ScrollContext, */ ...forwardContext);
  const camera = useRef<PerspectiveCamera>();
  const unmountFunc = useRef<() => void>();

  useEffect(() => {
    return () => {
      unmountFunc.current?.();
      onUnmount?.();
    };
  }, [onUnmount]);

  return (
    <R3FCanvas
      {...rest}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...rest.style,
      }}
      onCreated={async (state: RootState) => {
        // @ts-ignore
        camera.current = state.camera as PerspectiveCamera;
        const updateFunc: gsap.TickerCallback = (timestamp) => {
          state?.advance(timestamp);
        };

        // TODO add stats.js

        unmountFunc.current = () => {
          gsap.ticker.remove(updateFunc);
        };

        onCreated?.(state);

        gsap.ticker.add(updateFunc, false, true);
      }}
      frameloop="never"
    >
      <ContextBridge>
        <Scroll>
          <scrollTunnel.Out />
        </Scroll>
        <noScrollTunnel.Out />

        {children}
      </ContextBridge>
    </R3FCanvas>
  );
};

FullScreenCanvas.InScroll = scrollTunnel.In;
FullScreenCanvas.InNoScroll = noScrollTunnel.In;
