import { Text3D } from "@bsmnt/webgl";
import Head from "next/head";

export default function Text3dPage() {
  return (
    <div>
      <Head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Text3D
        as="h1"
        font={{
          family: "Roboto",
          size: "32px",
          weight: 700,
          src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2",
        }}
      >
        We make cool shit that performs
      </Text3D>
    </div>
  );
}
