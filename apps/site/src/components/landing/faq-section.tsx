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
    a: "imeetly is an AI meeting summarizer that turns recordings and transcripts into clear, structured notes. Upload audio, video, or text and get summaries, action items, decisions, and blockers in seconds.",
  },
  {
    q: "How does AI meeting summarization work?",
    a: "Upload a recording or paste a transcript. Our AI analyzes the full conversation using meeting transcription AI to extract key points, decisions, and action items — then delivers structured meeting notes you can share with your team.",
  },
  {
    q: "What file types can I upload?",
    a: "imeetly supports all major audio formats (MP3, WAV, M4A, OGG, FLAC) and video formats (MP4, MOV, WebM). You can also paste raw text transcripts directly.",
  },
  {
    q: "Can I use imeetly for team meetings?",
    a: "Yes. imeetly is built for meeting notes for teams. The Team plan gives you shared meeting libraries, visibility into action items across the team, and collaborative workflows so everyone stays aligned.",
  },
  {
    q: "Does imeetly save meeting notes automatically?",
    a: "Yes. Once your meeting is processed, the AI meeting notes are saved to your account automatically. Your full meeting history is searchable and always available.",
  },
  {
    q: "What happens on the free plan?",
    a: "The free plan includes 5 meetings per month with full AI processing — summaries, action items, decisions, and blockers. Your meeting history is always available. Upgrade anytime for higher limits.",
  },
  {
    q: "Can I edit the generated notes?",
    a: "Yes. All generated AI meeting summaries, action items, and decisions are fully editable. You can refine, add context, or remove anything before sharing with your team.",
  },
  {
    q: "Do you store my recordings?",
    a: "No. Uploaded files are processed and then deleted from our servers. We only store the generated notes and transcripts — never the original recordings. You can delete your data at any time.",
  },
  {
    q: "Who is imeetly for?",
    a: "imeetly is for anyone who runs meetings — product teams, startups, agencies, founders, and recruiters. If you spend time in meetings and need clear notes without the busywork, imeetly is for you.",
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
