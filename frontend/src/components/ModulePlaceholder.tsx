type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export default function ModulePlaceholder({
  title,
  description
}: ModulePlaceholderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Module Scaffold
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <p className="mt-6 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
        TODO: Replace this placeholder with feature UI after requirements and API
        contracts are finalized.
      </p>
    </section>
  );
}
