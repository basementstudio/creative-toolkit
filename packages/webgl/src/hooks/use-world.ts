import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import type { PerspectiveCamera } from "three";

import { useViewportSize } from "./use-viewport";

const getHeight = (camera: PerspectiveCamera) => {
  const distance = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;

  return 2 * Math.tan(vFov / 2) * distance;
};

type Rect = {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
};

export const useWorld = () => {
  const camera = useThree((state) => state.camera);
  const {
    height: vpHeight,
    width: vpWidth,
    ratio: vpRatio,
  } = useViewportSize({ unsafe: true });

  return useMemo(() => {
    // @ts-ignore
    const height = getHeight(camera as PerspectiveCamera);
    const width = height * vpRatio;

    const fromViewport = (rect: Pick<Rect, "height" | "width">) => {
      const _width = (width * (rect?.width || 0)) / (vpWidth || 1);
      const _height = (height * (rect?.height || 0)) / (vpHeight || 1);

      return { width: _width, height: _height, x: _width, y: _height };
    };

    const fromBoundingRect = (rect: Rect) => {
      const size = fromViewport({
        width: rect.width,
        height: rect.height,
      });

      const position = fromViewport({
        width: rect.left,
        height: rect.top,
      });

      return {
        size,
        position: {
          x: position.width - width / 2 + size.width / 2,
          y: -(position.height - height / 2 + size.height / 2),
        },
      };
    };

    return {
      fromViewport,
      fromBoundingRect,
    };
  }, [camera, vpHeight, vpWidth, vpRatio]);
};
