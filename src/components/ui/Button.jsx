export function Button({ children = "medium", variant = "primary", endAdornment }) {
  return (
    <button className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold ${
      variant === "text" ? "text-gray-900" : "bg-indigo-600 text-white"
    }`}>
      {children}
      {endAdornment}
    </button>
  );
}