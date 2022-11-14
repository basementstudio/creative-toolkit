import "../styles/globals.css";
import type { AppProps } from "next/app";
import { PageTransitionProvider } from "@bsmnt/page-transition";
import { FullScreenCanvas } from "@bsmnt/webgl";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <FullScreenCanvas>
        <ambientLight intensity={0.5} />
      </FullScreenCanvas>
      <PageTransitionProvider>
        <Component {...pageProps} />
      </PageTransitionProvider>
    </>
  );
}
