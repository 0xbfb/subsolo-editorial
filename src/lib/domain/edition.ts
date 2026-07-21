export type EditionFixture = Readonly<{
  id: string;
  date: string;
  status: 'fixture';
  title: string;
}>;

export const isEditionFixture = (value: unknown): value is EditionFixture => {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    /^ed_\d{4}-\d{2}-\d{2}$/.test(record.id) &&
    typeof record.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
    record.status === 'fixture' &&
    typeof record.title === 'string' &&
    record.title.length > 0
  );
};
