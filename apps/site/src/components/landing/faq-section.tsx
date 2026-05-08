import { FadeIn } from "@/components/common/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const faqs = [
  {
    q: "What is imeetly?",
    a: "imeetly is the memory layer for meetings. It turns your recordings or transcripts into summaries, decisions, action items, blockers, and follow-ups, then makes your meeting history searchable. No more rewatching recordings. No more forgetting what was decided.",
  },
  {
    q: "How does imeetly work?",
    a: "Connect your meeting tools, import available recordings, and use AI to extract summaries, decisions, blockers, and action items. You can also upload audio, video, or paste transcripts directly.",
  },
  {
    q: "Which meeting platforms does imeetly support?",
    a: "imeetly integrates with Zoom, Google Meet, and Microsoft Teams. Zoom and Google Meet support recording import, and Microsoft Teams supports calendar sync and manual recording import.",
  },
  {
    q: "What file types can I upload?",
    a: "imeetly supports all major audio formats (MP3, WAV, M4A, OGG, FLAC) and video formats (MP4, MOV, WebM). You can also paste raw text transcripts directly.",
  },
  {
    q: "Can I use imeetly for team meetings?",
    a: "Yes. imeetly is built for teams that need a shared record of summaries, decisions, action items, and follow-ups. The Team plan is planned for higher limits and team workflows.",
  },
  {
    q: "Does imeetly save meeting records automatically?",
    a: "Yes. Once your meeting is processed, AI-generated notes, action items, and decisions are saved to your account. Your meeting history is searchable from the dashboard.",
  },
  {
    q: "What happens on the free plan?",
    a: "The free plan includes 5 meetings per month with full AI processing: summaries, action items, decisions, and blockers. Your meeting history is always accessible. Upgrade anytime for higher limits.",
  },
  {
    q: "Can I edit the generated notes?",
    a: "Yes. All AI-generated summaries, action items, and decisions are fully editable. Refine, add context, or remove anything before sharing with your team.",
  },
  {
    q: "Do you store my recordings?",
    a: "No. Uploaded files are processed and then deleted from our servers. We only store the generated notes and transcripts, never the original recordings. You can delete your data at any time.",
  },
  {
    q: "Who is imeetly for?",
    a: "imeetly is for any team that runs on meetings: product teams, startups, agencies, founders, and recruiters. If you want to reduce tool-switching and make every meeting actionable, imeetly is built for you.",
  },
];

export function FAQSection() {
  return (
    <section className="border-t py-20" id="faq">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about imeetly.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Accordion>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="cursor-pointer">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p>{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
