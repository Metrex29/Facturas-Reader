export function Badge({ children = "medium" }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
      {children}
    </span>
  );
}