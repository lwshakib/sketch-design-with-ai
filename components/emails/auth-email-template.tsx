import * as React from "react";

interface AuthEmailTemplateProps {
  type: "email-verification" | "forgot-password";
  url: string;
}

export function AuthEmailTemplate({ type, url }: AuthEmailTemplateProps) {
  const isVerification = type === "email-verification";

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f9fafb",
        padding: "40px 20px",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              letterSpacing: "-0.025em",
              margin: "0",
              color: "#000000",
            }}
          >
            Sketch.
          </h1>
        </div>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "16px",
            color: "#111827",
          }}
        >
          {isVerification ? "Verify your email address" : "Reset your password"}
        </h2>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "24px",
            color: "#4b5563",
            marginBottom: "32px",
          }}
        >
          {isVerification
            ? "Welcome to Sketch! Please click the button below to verify your email address and get started."
            : "We received a request to reset your password. If you didn't make this request, you can safely ignore this email."}
        </p>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a
            href={url}
            style={{
              display: "inline-block",
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
          >
            {isVerification ? "Verify Email" : "Reset Password"}
          </a>
        </div>

        <p
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            color: "#9ca3af",
            margin: "0",
          }}
        >
          If you're having trouble clicking the button, copy and paste this URL
          into your browser:
        </p>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            color: "#3b82f6",
            wordBreak: "break-all",
            marginTop: "8px",
          }}
        >
          {url}
        </p>

        <div
          style={{
            marginTop: "40px",
            paddingTop: "32px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
            &copy; {new Date().getFullYear()} Sketch. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
