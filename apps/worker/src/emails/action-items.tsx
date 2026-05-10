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
import type React from "react";

type TaskEmailItem = {
  title: string;
  meetingTitle?: string;
  dueDate?: string;
  priority?: string;
};

export function ActionItemReminderEmail({
  userName,
  title,
  meetingTitle,
  dueDate,
  priority,
  taskUrl,
}: {
  userName: string | null;
  title: string;
  meetingTitle: string;
  dueDate: string;
  priority: string;
  taskUrl: string;
}) {
  return (
    <EmailShell
      footerReason="You're receiving this because an action item reminder is due in imeetly."
      preview={`Action item reminder: ${title}`}
    >
      <Text style={greeting}>Hi{userName ? ` ${userName}` : ""},</Text>
      <Heading style={heading}>Action item reminder</Heading>
      <Text style={paragraph}>This action item needs attention:</Text>
      <Section style={taskBox}>
        <Text style={taskTitle}>{title}</Text>
        <Text style={taskMeta}>
          {meetingTitle} · {dueDate} · {priority}
        </Text>
      </Section>
      <Section style={buttonSection}>
        <Button href={taskUrl} style={button}>
          Open action items
        </Button>
      </Section>
    </EmailShell>
  );
}

export function OverdueActionItemsDigestEmail({
  userName,
  items,
  taskUrl,
}: {
  userName: string | null;
  items: TaskEmailItem[];
  taskUrl: string;
}) {
  return (
    <EmailShell
      footerReason="You're receiving this because you have overdue action items in imeetly."
      preview={`${items.length} overdue action item${items.length === 1 ? "" : "s"}`}
    >
      <Text style={greeting}>Hi{userName ? ` ${userName}` : ""},</Text>
      <Heading style={heading}>
        {items.length} overdue action item{items.length === 1 ? "" : "s"}
      </Heading>
      <Text style={paragraph}>These tasks are past due and still open:</Text>
      <TaskList items={items} />
      <Section style={buttonSection}>
        <Button href={taskUrl} style={button}>
          Review overdue tasks
        </Button>
      </Section>
    </EmailShell>
  );
}

export function WeeklyActionItemRecapEmail({
  userName,
  completedCount,
  overdueCount,
  upcomingCount,
  taskUrl,
}: {
  userName: string | null;
  completedCount: number;
  overdueCount: number;
  upcomingCount: number;
  taskUrl: string;
}) {
  return (
    <EmailShell
      footerReason="You're receiving this because you have recent or open action items in imeetly."
      preview="Your weekly imeetly task recap"
    >
      <Text style={greeting}>Hi{userName ? ` ${userName}` : ""},</Text>
      <Heading style={heading}>Your weekly task recap</Heading>
      <Text style={paragraph}>
        Here is the current state of your action items:
      </Text>
      <Section style={statsGrid}>
        <Row>
          <Column style={statColumn}>
            <Text style={statLabel}>Completed</Text>
            <Text style={statValue}>{completedCount}</Text>
          </Column>
          <Column style={statColumn}>
            <Text style={statLabel}>Overdue</Text>
            <Text style={statValue}>{overdueCount}</Text>
          </Column>
          <Column style={statColumn}>
            <Text style={statLabel}>Due soon</Text>
            <Text style={statValue}>{upcomingCount}</Text>
          </Column>
        </Row>
      </Section>
      <Section style={buttonSection}>
        <Button href={taskUrl} style={button}>
          Open task dashboard
        </Button>
      </Section>
    </EmailShell>
  );
}

function EmailShell({
  preview,
  footerReason,
  children,
}: {
  preview: string;
  footerReason: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
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

          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              imeetly - The memory layer for meetings.
            </Text>
            <Text style={footerSub}>{footerReason}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function TaskList({ items }: { items: TaskEmailItem[] }) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      {items.map((item) => (
        <Section key={`${item.title}-${item.dueDate}`} style={taskBox}>
          <Text style={taskTitle}>{item.title}</Text>
          <Text style={taskMeta}>
            {[item.meetingTitle, item.dueDate, item.priority]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </Section>
      ))}
    </Section>
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
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  margin: "40px auto",
  maxWidth: "540px",
  padding: "0 0 24px",
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

const taskBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  marginBottom: "10px",
  padding: "12px 16px",
};

const taskTitle: React.CSSProperties = {
  color: "#111111",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: "0 0 4px",
};

const taskMeta: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const statsGrid: React.CSSProperties = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "8px",
  marginBottom: "24px",
  padding: "12px 16px",
};

const statColumn: React.CSSProperties = {
  textAlign: "center",
  width: "33.333%",
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

const footer: React.CSSProperties = {
  padding: "16px 32px 0",
};

const footerText: React.CSSProperties = {
  color: "#666666",
  fontSize: "13px",
  margin: "0 0 4px",
};

const footerSub: React.CSSProperties = {
  color: "#999999",
  fontSize: "12px",
  margin: "0",
};
