export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#24252A]">{title}</h1>
      <div className="mt-8 rounded-xl border border-dashed border-[#D2CDBD] bg-white p-10 text-center text-sm text-[#7D7874]">
        Esse módulo ainda não foi construído — chega na {phase}.
      </div>
    </div>
  );
}
