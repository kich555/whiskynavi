"use client";

interface Props {
  title: string;
  subtitle: string;
}

const BrandTitle = ({ title, subtitle }: Props) => {
  return (
    <div className="mb-8 px-6 pt-8 text-center lg:mb-10 lg:px-0">
      <h2 className="mb-3 text-2xl text-white sm:text-3xl lg:text-4xl">{title}</h2>
      <p className="typo-medium-14 text-white/80 sm:text-base lg:text-lg">{subtitle}</p>
    </div>
  );
};

export default BrandTitle;
