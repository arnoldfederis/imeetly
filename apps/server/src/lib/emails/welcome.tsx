import {
  Body,
  Button,
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
      <Preview>
        Welcome to imeetly - your meetings, summarized in seconds
      </Preview>
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

          <Heading style={heading}>Welcome to imeetly</Heading>
          <Text style={tagline}>Your meetings, summarized in seconds</Text>

          <Hr style={divider} />

          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>
            Thanks for joining imeetly. Upload a recording or paste a transcript
            - imeetly will generate a summary, decisions, blockers, follow-ups,
            and action items automatically.
          </Text>

          <Section style={buttonSection}>
            <Button href={`${appUrl}/meetings/new`} style={button}>
              Create your first meeting
            </Button>
          </Section>

          <Hr style={divider} />

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

          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because you created an imeetly account.
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
  color: "#6b7280",
  fontSize: "13px",
  margin: "4px 0 0",
  textAlign: "center" as const,
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};

const tipHeading: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 6px",
};

const tipLink: React.CSSProperties = {
  margin: "8px 0 0",
};

const link: React.CSSProperties = {
  color: "#111827",
  fontWeight: 600,
  textDecoration: "underline",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center" as const,
};
