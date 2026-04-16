/** `inboxPageRangeTemplate` içindeki {{start}}, {{end}}, {{total}} yer tutucularını doldurur. */
export function formatMailPageRange(
  template: string,
  emptyLabel: string,
  pageIndex: number,
  pageSize: number,
  totalCount: number,
): string {
  if (totalCount <= 0) return emptyLabel;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);
  return template
    .replace(/\{\{start\}\}/g, String(start))
    .replace(/\{\{end\}\}/g, String(end))
    .replace(/\{\{total\}\}/g, String(totalCount));
}
