// Shared render deadline for landing data: marketing sections degrade to
// empty rather than block the page when the database is slow.
export function deadlineAfter(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} budget exceeded`)), ms);
  });
}
