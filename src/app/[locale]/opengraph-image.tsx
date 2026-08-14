import { ImageResponse } from "next/og";

export const alt = "Belluzzi Open Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
  const { locale } = await params;
  const isPt = locale === "pt";

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#0e0f12",
          color: "#f2f3f1",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "68px 76px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(58,59,66,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(58,59,66,.32) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            display: "flex",
            inset: 0,
            opacity: 0.55,
            position: "absolute",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.12em",
            position: "relative",
            textTransform: "uppercase",
          }}
        >
          Belluzzi&nbsp;<span style={{ color: "#c84a5c" }}>Open Tools.</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 950,
            position: "relative",
          }}
        >
          <div
            style={{
              color: "#c84a5c",
              display: "flex",
              fontSize: 18,
              letterSpacing: "0.18em",
              marginBottom: 24,
              textTransform: "uppercase",
            }}
          >
            {isPt ? "Gratuito · aberto · privado" : "Free · open · private"}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "serif",
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            {isPt
              ? "Ferramentas úteis. Seus dados continuam seus."
              : "Useful tools. Your data remains yours."}
          </div>
        </div>

        <div
          style={{
            color: "#92929b",
            display: "flex",
            fontSize: 19,
            justifyContent: "space-between",
            letterSpacing: "0.08em",
            position: "relative",
            textTransform: "uppercase",
          }}
        >
          <span>tools.belluzzi.dev</span>
          <span>QR Code Studio</span>
        </div>
      </div>
    ),
    size,
  );
}
