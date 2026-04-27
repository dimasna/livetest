import { type ZodIssue } from 'zod';

export function zodErrorsToFieldErrors(issues: ZodIssue[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join('.');
    const arr = fieldErrors[key] ?? [];
    arr.push(issue.message);
    fieldErrors[key] = arr;
  }
  return fieldErrors;
}