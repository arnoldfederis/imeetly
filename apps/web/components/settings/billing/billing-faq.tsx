"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function BillingFaq() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing FAQ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-muted-foreground text-sm">
          <FaqItem
            answer="Free plan limits reset on the 1st of each calendar month. Paid plans follow your subscription billing cycle."
            question="When do my meeting limits reset?"
          />
          <Separator />
          <FaqItem
            answer="You will be redirected to our payment provider to complete the checkout. Your meeting quota increases immediately after payment."
            question="What happens when I upgrade?"
          />
          <Separator />
          <FaqItem
            answer="Yearly plans save you 20% compared to monthly. Usage limits remain the same - they reset every month regardless of billing cycle."
            question="What's the difference between monthly and yearly?"
          />
          <Separator />
          <FaqItem
            answer="We do not store your card details. All payments are securely handled by our payment provider, Polar."
            question="Is my payment information secure?"
          />
          <Separator />
          <FaqItem
            answer="Yes. Cancel through the billing portal and your plan remains active until the end of the current billing period."
            question="Can I cancel anytime?"
          />
          <Separator />
          <FaqItem
            answer="Free users get 5 AI memory searches per day. Pro users get 100 per day and receive full AI-generated answers with source citations. Limits reset at midnight UTC. All plans are subject to fair-use and abuse prevention."
            question="How does AI Memory Search work across plans?"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <p className="font-medium text-foreground">{question}</p>
      <p className="mt-1">{answer}</p>
    </div>
  );
}
