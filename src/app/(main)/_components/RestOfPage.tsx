"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { overlay } from "overlay-kit";

interface RestOfPageProps {
  youtubeEmbedUrl: string;
}

export default function RestOfPage({ youtubeEmbedUrl }: RestOfPageProps) {
  return (
    <>
      {/* Quick Navigation Cards */}
      <section className="py-6 md:py-12">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
            {/* OUR BRANDS Card */}
            <Link
              href="/brand"
              className="group flex aspect-square flex-col items-center justify-center border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-white/30 hover:bg-white/10 md:p-4"
            >
              <div className="typo-bold-14 mb-2 text-white md:mb-3 md:text-xl lg:text-2xl">OUR BRANDS</div>
              <div className="mb-3 text-[10px] leading-relaxed text-gray-400 md:mb-6 md:typo-medium-14">
                <span className="hidden md:inline">
                  위스키내비에서 전개하고 있는
                  <br />
                </span>
                <span className="hidden md:inline">다양한 브랜드들을 만나보세요.</span>
              </div>
              <div className="typo-bold-12 flex items-center gap-1 text-white/60 transition-colors group-hover:text-white md:typo-medium-14">
                바로가기 <ArrowRight size={12} className="md:size-4" />
              </div>
            </Link>

            {/* ARCHIVE Card */}
            <Link
              href="/archive"
              className="group flex aspect-square flex-col items-center justify-center border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-white/30 hover:bg-white/10 md:p-4"
            >
              <div className="typo-bold-14 mb-2 text-white md:mb-3 md:text-xl lg:text-2xl">ARCHIVE</div>
              <div className="mb-3 text-[10px] leading-relaxed text-gray-400 md:mb-6 md:typo-medium-14">
                <span className="hidden md:inline">
                  위스키내비에서 발매한
                  <br />
                </span>
                <span className="hidden md:inline">제품들을 둘러보세요.</span>
              </div>
              <div className="typo-bold-12 flex items-center gap-1 text-white/60 transition-colors group-hover:text-white md:typo-medium-14">
                바로가기 <ArrowRight size={12} className="md:size-4" />
              </div>
            </Link>

            {/* RESERVATION Card */}
            {/* <Link
              href="#"
              className="group flex aspect-square flex-col items-center justify-center border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-white/30 hover:bg-white/10 md:p-4"
            > */}
            <div
              onClick={() =>
                overlay.open(({ isOpen, close }) =>
                  isOpen ? (
                    <Dialog open={isOpen} onOpenChange={close}>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="typo-bold-20">아직 준비중입니다.</DialogTitle>

                          <DialogDescription className="pt-2 text-gray-600">
                            예약 서비스는 아직 준비중입니다.
                          </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="gap-2 sm:gap-2">
                          <Button className="flex-1" onClick={close}>
                            확인
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : null,
                )
              }
              className="group flex aspect-square flex-col items-center justify-center border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-white/30 hover:bg-white/10 md:p-4"
            >
              <div className="typo-bold-14 mb-2 text-white md:mb-3 md:text-xl lg:text-2xl">RESERVATION</div>
              <div className="mb-3 text-[10px] leading-relaxed text-gray-400 md:mb-6 md:typo-medium-14">준비중</div>
            </div>
            {/* </Link> */}

            {/* COMMUNITY Card */}
            <div
              onClick={() =>
                overlay.open(({ isOpen, close }) =>
                  isOpen ? (
                    <Dialog open={isOpen} onOpenChange={close}>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="typo-bold-20">아직 준비중입니다.</DialogTitle>

                          <DialogDescription className="pt-2 text-gray-600">
                            커뮤니티 서비스는 아직 준비중이오니 위스키내비 단톡을 사용해주세요
                          </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="gap-2 sm:gap-2">
                          <Button className="flex-1" onClick={close}>
                            확인
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : null,
                )
              }
              className="group flex aspect-square flex-col items-center justify-center border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-white/30 hover:bg-white/10 md:p-4"
            >
              <div className="typo-bold-14 mb-2 text-white md:mb-3 md:text-xl lg:text-2xl">COMMUNITY</div>
              <div className="mb-3 text-[10px] leading-relaxed text-gray-400 md:mb-6 md:typo-medium-14">준비중입니다.</div>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Section */}
      {youtubeEmbedUrl && (
        <section className="py-6 md:py-12">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
            <div className="mb-4 md:mb-8">
              <h2 className="mb-1 text-lg font-bold text-white md:mb-2 md:text-2xl">YOUTUBE</h2>
            </div>

            <div className="relative mb-4 aspect-video overflow-hidden border border-white/10 bg-gray-900 md:mb-6">
              <iframe
                src={youtubeEmbedUrl}
                title="위스키내비 YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>

            <div className="text-center">
              <a
                href="https://www.youtube.com/@WhiskyNavi"
                target="_blank"
                rel="noopener noreferrer"
                className="typo-medium-12 inline-flex items-center gap-2 text-white transition-all hover:gap-3 hover:text-gray-300 md:typo-medium-14 lg:text-base"
              >
                더 많은 영상 보러가기
                <ArrowRight size={14} className="md:size-4 lg:size-5" />
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
