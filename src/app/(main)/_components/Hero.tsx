interface HeroProps {
  backgroundText: string;
  title: string;
  subtitle: string;
}

const Hero = ({ backgroundText, title, subtitle }: HeroProps) => {
  return (
    <section className="relative h-[35vh] max-h-[400px] overflow-hidden pt-16 lg:h-[40vh] lg:pt-20">
      {/* linear Background */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0f1419] to-[#1d2429]">
        {/* Huge Typography - Abstract Background Pattern */}
        <div className="absolute inset-0 hidden items-center justify-center overflow-hidden lg:flex">
          <p
            className="text-[45vw] leading-none tracking-[0.02em] whitespace-nowrap text-white/1.5 select-none sm:text-[42vw] md:text-[38vw] lg:text-[35vw]"
            style={{
              fontFamily: "D-DIN Condensed, sans-serif",
              fontWeight: 700,
            }}
          >
            {backgroundText}
          </p>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 bottom-0 left-[20%] w-px bg-linear-to-b from-transparent via-white/40 to-transparent" />
          <div className="absolute top-0 bottom-0 left-[40%] w-px bg-linear-to-b from-transparent via-white/30 to-transparent" />
          <div className="absolute top-0 right-[40%] bottom-0 w-px bg-linear-to-b from-transparent via-white/30 to-transparent" />
          <div className="absolute top-0 right-[20%] bottom-0 w-px bg-linear-to-b from-transparent via-white/40 to-transparent" />

          <div className="absolute top-[30%] right-0 left-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute top-[70%] right-0 left-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Accent Lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute top-1/4 right-0 left-0 h-px origin-center -rotate-2 transform bg-linear-to-r from-white/20 via-transparent to-white/20" />
          <div className="absolute right-0 bottom-1/4 left-0 h-px origin-center rotate-2 transform bg-linear-to-r from-white/20 via-transparent to-white/20" />
        </div>

        {/* Glowing Dots */}
        <div className="absolute inset-0">
          <div className="absolute top-[25%] left-[15%] h-2 w-2 rounded-full bg-white opacity-60" />
          <div className="absolute top-[60%] right-[20%] h-2 w-2 rounded-full bg-white opacity-60" />
          <div className="absolute bottom-[30%] left-[70%] h-1.5 w-1.5 rounded-full bg-white opacity-40" />
          <div className="absolute top-[45%] left-[85%] h-1.5 w-1.5 rounded-full bg-white opacity-40" />
        </div>

        {/* Fade out linear at bottom */}
        <div className="absolute right-0 bottom-0 left-0 h-32 bg-linear-to-b from-transparent to-[#1d2429]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mx-auto text-center">
            <h1
              className="typo-bold-36 mb-5 tracking-tight text-white md:text-5xl lg:text-6xl"
              style={{ textShadow: "0 0 40px rgba(255,255,255,0.15)" }}
            >
              {title}
            </h1>

            <div className="mx-auto mb-6 h-1 w-24 bg-linear-to-r from-transparent via-white to-transparent opacity-80 md:w-32 lg:w-40" />

            <p className="text-sm leading-relaxed font-light tracking-wider text-white/80 italic md:text-base lg:text-lg">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
