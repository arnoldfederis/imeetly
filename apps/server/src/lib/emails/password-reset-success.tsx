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

export function PasswordResetSuccessEmail({
  appUrl,
  preview,
  siteUrl,
}: {
  appUrl: string;
  preview: string;
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
            <Heading style={heading}>Password updated</Heading>
            <Text style={tagline}>
              Never lose what happened in a meeting again
            </Text>
            <Text style={subTagline}>The memory layer for meetings.</Text>

            <Text style={paragraph}>
              Your imeetly password was changed successfully. If this was you,
              you can sign in with your new password now.
            </Text>

            <Section style={actionSection}>
              <Button href={appUrl} style={button}>
                Open imeetly
              </Button>
            </Section>

            <Text style={helperText}>
              If you didn&apos;t make this change, reset your password again
              immediately and review your account security settings.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              imeetly - The memory layer for meetings.
            </Text>
            <Text style={footerSub}>
              You&apos;re receiving this because your imeetly password was
              changed.
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
  lineHeight: "1.6",
  margin: "0 auto",
  maxWidth: "420px",
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
