import { Center, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { FC, memo, RefObject, useEffect, useMemo, useRef } from "react";
import { Color } from "three";
import { FullScreenCanvas } from "../..";
import { useWorld } from "../../../hooks/use-world";
import { PositionedGroup } from "../group";

type TextR3FProps = {
  centerToElementRef: RefObject<HTMLDivElement>;
  children: string;
  color?: [number, number, number] | string | undefined;
  overflowWrap?: "normal" | "break-word" | undefined;
  textAlign?: "center" | "left" | "right" | "justify" | undefined;
  fontSrc: string;
};

const TextR3F: FC<TextR3FProps> = memo(
  ({
    centerToElementRef,
    children,
    color = new Color("#fff"),
    overflowWrap,
    textAlign = "left",
    fontSrc,
  }) => {
    const widthCanvas = useThree((state) => state.viewport.width);
    const widthViewport = useThree((state) => state.size.width);
    const ref = useRef();

    const { fromBoundingRect } = useWorld();

    const bounds = useMemo(() => {
      const centerToElement = centerToElementRef.current;
      if (!centerToElement) return null;

      return fromBoundingRect(centerToElement.getBoundingClientRect());
    }, [centerToElementRef, fromBoundingRect]);

    const computedValues = useMemo(() => {
      const centerToElement = centerToElementRef.current;
      if (!bounds || !centerToElement) return null;

      const pxVal = widthCanvas / widthViewport;

      const lineHeight = gsap.getProperty(
        centerToElement,
        "lineHeight"
      ) as number;

      const letterSpacing = gsap.getProperty(
        centerToElement,
        "letterSpacing"
      ) as number;

      const uppercase =
        gsap.getProperty(centerToElement, "textTransform") === "uppercase";

      const fontSize = gsap.getProperty(centerToElement, "fontSize") as number;

      return {
        letterSpacing: 0,
        lineHeight: lineHeight / fontSize,
        maxWidth: bounds.size.width,
        size: fontSize * pxVal,
        uppercase,
      };
    }, [bounds, centerToElementRef, widthCanvas, widthViewport]);

    if (!computedValues) return null;

    const { size, maxWidth, letterSpacing, lineHeight, uppercase } =
      computedValues;

    return (
      <PositionedGroup shadowRef={centerToElementRef} stick noScale>
        <Text
          anchorX="left"
          color={color}
          font={fontSrc}
          fontSize={size}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          maxWidth={maxWidth}
          overflowWrap={overflowWrap}
          ref={ref}
          textAlign={textAlign}
          position={[-(maxWidth / 2), 0, 0]}
        >
          {uppercase ? children.toUpperCase() : children}
        </Text>
        <mesh position={[-(maxWidth / 2), 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      </PositionedGroup>
    );
  }
);

type Text3DProps = {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
  centerToElementRef?: RefObject<HTMLDivElement>;
  font: {
    size: string;
    family: string;
    weight: number;
    src: string;
    style?: string;
  };
} & Pick<TextR3FProps, "color" | "overflowWrap" | "textAlign" | "children">;

export const Text3D = ({
  centerToElementRef,
  children,
  color = [255, 255, 255],
  textAlign = "left",
  as: Comp,
  font,
}: Text3DProps) => {
  const htmlElementRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <FullScreenCanvas.InScroll>
        <TextR3F
          centerToElementRef={centerToElementRef ?? htmlElementRef}
          color={color}
          textAlign={textAlign}
          fontSrc={font.src}
        >
          {children}
        </TextR3F>
      </FullScreenCanvas.InScroll>
      <Comp
        ref={htmlElementRef}
        style={{
          textAlign,
          fontWeight: font.weight,
          color: Array.isArray(color)
            ? `rgb(${color[0]}, ${color[1]}, ${color[2]})`
            : color,
          fontSize: font.size,
          fontFamily: font.family,
        }}
      >
        {children}
      </Comp>
    </>
  );
};
