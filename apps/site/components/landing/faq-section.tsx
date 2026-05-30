"use client";

import { FadeIn } from "@/components/common/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/faq-data";

export function FAQSection() {
  return (
    <section className="py-32 sm:py-40" id="faq">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn className="mb-14 text-center">
          <p className="mb-4 font-medium text-muted-foreground text-sm uppercase tracking-widest">
            FAQ
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Everything you need to know about imeetly.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Accordion className="border-0">
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
