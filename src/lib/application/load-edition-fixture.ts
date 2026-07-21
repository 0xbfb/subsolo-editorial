import { isEditionFixture, type EditionFixture } from '@domain/edition';

export const loadEditionFixture = (input: unknown): EditionFixture => {
  if (!isEditionFixture(input)) {
    throw new Error('SUBSOLO_FIXTURE_INVALID: a edição mínima não respeita o contrato bootstrap.');
  }
  return input;
};
