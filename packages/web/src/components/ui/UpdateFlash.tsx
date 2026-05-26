import { useEffect, useState, useRef, type ReactNode } from "react";

interface UpdateFlashProps {
  updatedAt: string;
  children: ReactNode;
}

export function UpdateFlash({ updatedAt, children }: UpdateFlashProps) {
  const [highlight, setHighlight] = useState(false);
  const prevRef = useRef(updatedAt);

  useEffect(() => {
    if (prevRef.current && prevRef.current !== updatedAt) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      prevRef.current = updatedAt;
      return () => clearTimeout(timer);
    }
    prevRef.current = updatedAt;
  }, [updatedAt]);

  return (
    <div
      className={
        highlight
          ? "transition-colors duration-500 bg-blue-50 dark:bg-blue-900/20 rounded"
          : "transition-colors duration-500"
      }
    >
      {children}
    </div>
  );
}
