import { FadeIn } from "@/components/common/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What file types can I upload?",
    a: "imeetly supports all major audio formats (MP3, WAV, M4A, OGG, FLAC) and video formats (MP4, MOV, WebM). You can also paste raw text transcripts directly.",
  },
  {
    q: "Do you store my files permanently?",
    a: "Uploaded files are processed and then deleted from our servers. We only store the generated notes and transcripts — never the original recordings. You can delete your data at any time from your settings.",
  },
  {
    q: "Can I upload video and audio?",
    a: "Yes. You can upload both video and audio recordings. For video files, we extract and process the audio track automatically — no extra steps needed.",
  },
  {
    q: "What happens on the free plan?",
    a: "The free plan includes 5 meetings per month with full AI processing — summaries, action items, decisions, and blockers. Your meeting history is always available. Upgrade anytime for higher limits.",
  },
  {
    q: "Can I edit the generated notes?",
    a: "Yes. All generated summaries, action items, and decisions are fully editable. You can refine, add context, or remove anything before sharing with your team.",
  },
  {
    q: "Is this for teams or solo users?",
    a: "Both. Individual users love imeetly for personal meeting notes and tracking. Teams use the Team plan for shared meeting libraries, visibility into action items, and collaborative workflows.",
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
          <Accordion collapsible type="single">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
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
