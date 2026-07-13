"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteInquiryAction } from "../actions";

export default function InquiryDeleteButton({ inquiryId }: { inquiryId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteInquiryAction(inquiryId);
      if (!result.success) {
        toast.error(result.error ?? "문의를 삭제하지 못했습니다.");
        setConfirmed(false);
        return;
      }
      toast.success("문의를 삭제했습니다.");
      router.push("/my-page/inquiries");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDelete}
      onBlur={() => setConfirmed(false)}
      disabled={isPending}
      className="border-red-400/30 bg-transparent text-red-300 hover:bg-red-400/10 hover:text-red-200"
    >
      <Trash2 />
      {isPending ? "삭제 중..." : confirmed ? "한 번 더 눌러 삭제" : "문의 삭제"}
    </Button>
  );
}
