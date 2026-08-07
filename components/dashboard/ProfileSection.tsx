export function ProfileSection({ title, Icon, children }: {
  title: string;
  Icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={15} className="text-stone-400" strokeWidth={1.5} />}
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
