export function extractPostgreSQLVersion(versionString: string): string {
  const match = versionString.match(/PostgreSQL\s+(\d+\.\d+)/);
  return match ? match[1] : '';
}

// for pg_dump, pg_restore
export function extractOperationVersion(versionString: string): string {
  const match = versionString.match(/(\d+\.\d+)/);
  return match ? match[1] : '';
}

export function areVersionsCompatible(
  dbVersion: string,
  pgOperationVersion: string,
): boolean {
  const dbMajor = parseInt(dbVersion.split('.')[0]);
  const dumpMajor = parseInt(pgOperationVersion.split('.')[0]);

  const majorDiff = Math.abs(dbMajor - dumpMajor);
  return majorDiff <= 1;
}
