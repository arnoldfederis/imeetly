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

export function WelcomeEmail({
  name,
  appUrl,
  siteUrl,
}: {
  name: string;
  appUrl: string;
  siteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Never lose what happened in a meeting again</Preview>
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
            <Heading style={heading}>Welcome, {name}</Heading>
            <Text style={tagline}>
              Never lose what happened in a meeting again
            </Text>
            <Text style={subTagline}>The memory layer for meetings.</Text>

            <Text style={paragraph}>
              Upload a recording or paste a transcript - imeetly generates a
              summary, key decisions, blockers, follow-ups, and action items
              automatically.
            </Text>

            <Section style={buttonSection}>
              <Button href={`${appUrl}/meetings/new`} style={button}>
                Create your first meeting
              </Button>
            </Section>

            <Text style={tipHeading}>Connect your meeting tools</Text>
            <Text style={paragraph}>
              Skip manual uploads entirely. Connect Google Meet, Zoom, or
              Microsoft Teams and imeetly will pull in your recordings
              automatically.
            </Text>
            <Text style={tipLink}>
              <a href={`${appUrl}/settings/integrations`} style={link}>
                Set up integrations →
              </a>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              imeetly - The memory layer for meetings.
            </Text>
            <Text style={footerSub}>
              You're receiving this because you created an imeetly account.
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
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const buttonSection: React.CSSProperties = {
  marginBottom: "28px",
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

const tipHeading: React.CSSProperties = {
  color: "#111111",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 6px",
};

const tipLink: React.CSSProperties = {
  margin: "8px 0 0",
};

const link: React.CSSProperties = {
  color: "#6468f0",
  fontWeight: "600",
  textDecoration: "underline",
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
