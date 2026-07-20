"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { FAQ_DATA } from "../_lib/constants";

export default function FaqSection() {
  return (
    <div className="border border-white/10 bg-white/5 p-4 md:p-8">
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-6">
        <h3 className="typo-bold-20 flex items-center gap-2 text-white md:text-2xl">
          <HelpCircle size={24} className="text-white md:size-7" />
          자주 묻는 질문
        </h3>
        <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
          <Link href="/my-page/inquiries">
            <MessageCircleQuestion /> 1:1 문의
          </Link>
        </Button>
      </div>
      <Accordion type="single" collapsible className="space-y-2 md:space-y-3">
        {FAQ_DATA.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`} className="border border-white/10">
            <AccordionTrigger className="typo-bold-14 px-4 py-4 text-left text-white hover:bg-white/5 hover:no-underline md:px-5 md:text-base [&[data-state=open]>svg]:rotate-180">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="typo-medium-12 border-t border-white/10 px-4 pt-3 pb-4 text-gray-400 md:px-5 md:typo-medium-14">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
