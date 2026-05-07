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

interface MeetingReadyEmailProps {
  userName: string | null;
  meetingTitle: string;
  meetingUrl: string;
  openItemCount?: number;
}

export function MeetingReadyEmail({
  userName,
  meetingTitle,
  meetingUrl,
  openItemCount,
}: MeetingReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your meeting notes for "{meetingTitle}" are ready</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Row>
              <Column style={{ width: "40px" }}>
                <Img
                  alt="imeetly"
                  height={32}
                  src="https://imeetly.app/imeetly-transparent.png"
                  width={32}
                />
              </Column>
              <Column>
                <Text style={logoText}>imeetly</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hi{userName ? ` ${userName}` : ""},</Text>

            <Heading style={heading}>Your meeting notes are ready</Heading>

            <Text style={paragraph}>
              We've finished processing <strong>{meetingTitle}</strong>. Your
              AI-generated summary, key decisions, blockers, and follow-ups are
              all waiting for you.
            </Text>

            {openItemCount != null && openItemCount > 0 && (
              <Section style={statBox}>
                <Text style={statLabel}>Action items</Text>
                <Text style={statValue}>{openItemCount} open</Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button href={meetingUrl} style={button}>
                View meeting notes
              </Button>
            </Section>

            <Text style={hint}>
              Or copy this link into your browser:
              <br />
              <a href={meetingUrl} style={link}>
                {meetingUrl}
              </a>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              imeetly - The memory layer for meetings.
            </Text>
            <Text style={footerSub}>
              You're receiving this because you processed a meeting on imeetly.
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
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "40px auto",
  maxWidth: "540px",
  padding: "0 0 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const logoSection: React.CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "8px",
  padding: "24px 32px 20px",
};

const logoText: React.CSSProperties = {
  color: "#111111",
  display: "inline",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 0 8px",
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

const greeting: React.CSSProperties = {
  color: "#555555",
  fontSize: "15px",
  margin: "0 0 4px",
};

const heading: React.CSSProperties = {
  color: "#111111",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.3px",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#444444",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const statBox: React.CSSProperties = {
  backgroundColor: "#fff7ed",
  borderRadius: "8px",
  border: "1px solid #fed7aa",
  marginBottom: "24px",
  padding: "12px 16px",
};

const statLabel: React.CSSProperties = {
  color: "#9a3412",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  margin: "0 0 2px",
  textTransform: "uppercase",
};

const statValue: React.CSSProperties = {
  color: "#c2410c",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const buttonSection: React.CSSProperties = {
  marginBottom: "24px",
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

const hint: React.CSSProperties = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#6468f0",
  wordBreak: "break-all",
};

const footer: React.CSSProperties = {
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
