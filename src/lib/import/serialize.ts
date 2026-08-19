export function serializeImport(item: {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  headers: string;
  mappings: string;
  preview: string;
  stats: string;
  status: string;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}) {
  return {
    ...item,
    headers: JSON.parse(item.headers || "[]"),
    mappings: JSON.parse(item.mappings || "[]"),
    preview: JSON.parse(item.preview || "[]"),
    stats: JSON.parse(item.stats || "{}"),
  };
}
