import Head from "next/head";
import { FullScreenCanvas, PositionedGroup } from "@bsmnt/webgl";
import { useRef } from "react";
import Link from "next/link";

export const PageTemplate = ({
  fadedIn,
  isAbout,
}: {
  fadedIn: boolean;
  isAbout?: boolean;
}) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <Head>
        <title>{isAbout ? "About" : "Home"}</title>
      </Head>

      <FullScreenCanvas.InScroll>
        {fadedIn && (
          <PositionedGroup shadowRef={shadowRef}>
            <mesh>
              <boxGeometry />
              <meshStandardMaterial color={isAbout ? "#00ff00" : "#ff0000"} />
            </mesh>
          </PositionedGroup>
        )}
      </FullScreenCanvas.InScroll>

      <div
        ref={shadowRef}
        style={{
          width: "100px",
          height: "100px",
          position: "relative",
          zIndex: 1,
          border: "1px solid blue",
        }}
      />

      <div
        style={{
          marginTop: 64,
          display: "flex",
          zIndex: 1,
          position: "relative",
        }}
      >
        <Link style={{ color: isAbout ? "white" : "orange" }} href="/">
          Home
        </Link>
        <Link
          style={{ marginLeft: 32, color: isAbout ? "orange" : "white" }}
          href="/about"
        >
          About
        </Link>
      </div>
    </div>
  );
};
