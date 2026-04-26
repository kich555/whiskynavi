interface BusinessHeaderProps {
  title: string;
}

export default function BusinessHeader({ title }: BusinessHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}
