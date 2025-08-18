export function extractDbTypeFromFilename(filename: string) {
  const parts = filename.replace('.sql.gz', '').split('-');
  if (parts.length >= 3) {
    return parts[1];
  }
  return null;
}
