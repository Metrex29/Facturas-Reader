export function Button({ children = "medium", variant = "primary", endAdornment }) {
  return (
    <button className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold ${
      variant === "text"
        ? "text-gray-900 dark:text-gray-100 bg-transparent"
        : "bg-indigo-600 text-white dark:bg-black dark:text-gray-100"
    }`}>
      {children}
      {endAdornment}
    </button>
  );
}