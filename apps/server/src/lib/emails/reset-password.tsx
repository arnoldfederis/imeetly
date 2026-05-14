import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export function ResetPasswordEmail({
  preview,
  resetUrl,
  siteUrl,
}: {
  preview: string;
  resetUrl: string;
  siteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Row>
              <Column style={{ width: "44px" }}>
                <Img
                  alt="imeetly"
                  height={32}
                  src={`${siteUrl}/imeetly-transparent.png`}
                  width={32}
                />
              </Column>
              <Column>
                <Text style={logoText}>imeetly</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          <Section style={content}>
            <Heading style={heading}>Reset your password</Heading>
            <Text style={tagline}>
              Never lose what happened in a meeting again
            </Text>
            <Text style={subTagline}>The memory layer for meetings.</Text>

            <Text style={paragraph}>
              We received a request to reset your imeetly password. Use the
              button below to choose a new one.
            </Text>

            <Section style={actionSection}>
              <Button href={resetUrl} style={button}>
                Reset password
              </Button>
            </Section>

            <Text style={helperText}>
              If the button doesn&apos;t work, open this link:
            </Text>
            <a href={resetUrl} style={linkText}>
              {resetUrl}
            </a>

            <Text style={expiry}>This link expires in 1 hour.</Text>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              imeetly - The memory layer for meetings.
            </Text>
            <Text style={footerSub}>
              If you didn&apos;t request this change, you can safely ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  margin: "40px auto",
  maxWidth: "540px",
  padding: "0 0 24px",
};

const logoSection: React.CSSProperties = {
  padding: "24px 32px 20px",
};

const logoText: React.CSSProperties = {
  color: "#111111",
  display: "inline",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 0 4px",
  verticalAlign: "middle",
};

const divider: React.CSSProperties = {
  borderColor: "#ebebeb",
  borderTopWidth: "1px",
  margin: "0",
};

const content: React.CSSProperties = {
  padding: "32px 32px 8px",
};

const heading: React.CSSProperties = {
  color: "#111111",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.3px",
  margin: "0 0 6px",
};

const tagline: React.CSSProperties = {
  color: "#333333",
  fontSize: "15px",
  fontWeight: "500",
  margin: "0 0 2px",
};

const subTagline: React.CSSProperties = {
  color: "#888888",
  fontSize: "13px",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#444444",
  fontSize: "15px",
  margin: "0 0 24px",
  textAlign: "center",
};

const actionSection: React.CSSProperties = {
  margin: "0 0 20px",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#6468f0",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
};

const helperText: React.CSSProperties = {
  color: "#666666",
  fontSize: "13px",
  margin: "0 0 8px",
  textAlign: "center",
};

const linkText: React.CSSProperties = {
  color: "#6468f0",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const expiry: React.CSSProperties = {
  color: "#888888",
  fontSize: "13px",
  margin: "16px 0 0",
  textAlign: "center",
};

const footerSection: React.CSSProperties = {
  padding: "16px 32px 0",
};

const footerText: React.CSSProperties = {
  color: "#888888",
  fontSize: "13px",
  margin: "0 0 4px",
};

const footerSub: React.CSSProperties = {
  color: "#aaaaaa",
  fontSize: "11px",
  margin: "0",
};
