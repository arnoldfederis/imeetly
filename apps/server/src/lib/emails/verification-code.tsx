import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function VerificationCodeEmail({
  code,
  siteUrl,
}: {
  code: string;
  siteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your imeetly verification code: {code}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              alt="imeetly"
              height={40}
              src={`${siteUrl}/icons/icon-64.png`}
              style={logo}
              width={40}
            />
          </Section>

          <Heading style={heading}>imeetly</Heading>
          <Text style={tagline}>Your meetings, summarized in seconds</Text>
          <Text style={subTagline}>AI meeting notes for fast-moving teams</Text>

          <Hr style={divider} />

          <Text style={paragraph}>Your verification code is:</Text>

          <Section style={codeContainer}>
            <Text style={codeText}>{code}</Text>
          </Section>

          <Text style={expiry}>This code expires in 5 minutes.</Text>

          <Hr style={divider} />

          <Text style={footer}>
            If you didn't request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  margin: "40px auto",
  maxWidth: "420px",
  padding: "32px",
};

const logoSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "8px",
};

const logo: React.CSSProperties = {
  margin: "0 auto",
};

const heading: React.CSSProperties = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: 700,
  margin: "0",
  textAlign: "center" as const,
};

const tagline: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: 500,
  margin: "4px 0 0",
  textAlign: "center" as const,
};

const subTagline: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "2px 0 0",
  textAlign: "center" as const,
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const codeContainer: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  margin: "0 auto",
  padding: "16px 24px",
  textAlign: "center" as const,
};

const codeText: React.CSSProperties = {
  color: "#111827",
  fontFamily: "monospace",
  fontSize: "32px",
  fontWeight: 700,
  letterSpacing: "6px",
  margin: 0,
};

const expiry: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "16px 0 0",
  textAlign: "center" as const,
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center" as const,
};
