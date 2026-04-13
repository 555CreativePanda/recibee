import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely stringifies an object that may contain circular references.
 * Also handles Error objects which normally stringify to empty objects.
 */
export function safeStringify(obj: any, indent = 2): string {
  const cache = new WeakSet();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }

      if (value instanceof Error) {
        const error: any = {};
        Object.getOwnPropertyNames(value).forEach((propName) => {
          error[propName] = (value as any)[propName];
        });
        return error;
      }

      return value;
    },
    indent
  );
}
