import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import portraits from '../../src/data/media/portraits.json' with { type: 'json' };
import {
  createPictureModel,
  portraitForAuthor,
} from '../../src/lib/presentation/media-view-model.mjs';
test('registro lista os onze editores e não inventa retratos', () => {
  assert.equal(portraits.length, 11);
  assert.ok(portraits.every((x) => x.status === 'pending' && x.media_id === null));
});
test('fallback sem imagem permanece disponível', () => {
  const model = createPictureModel({ media: null, variant: 'card', fallbackAlt: 'Cora' });
  assert.equal(model.available, false);
  assert.equal(model.fallback, null);
});
test('picture model escolhe AVIF/WebP e JPEG fallback com dimensões', () => {
  const media = {
    alt: 'Retrato',
    credit: 'Subsolo',
    license: 'Editorial',
    derivatives: [
      {
        path: '/media/p.avif',
        variant: 'profile',
        format: 'avif',
        mime_type: 'image/avif',
        width: 1024,
        height: 1024,
      },
      {
        path: '/media/p.webp',
        variant: 'profile',
        format: 'webp',
        mime_type: 'image/webp',
        width: 1024,
        height: 1024,
      },
      {
        path: '/media/p.jpg',
        variant: 'profile',
        format: 'jpeg',
        mime_type: 'image/jpeg',
        width: 1024,
        height: 1024,
      },
    ],
  };
  const model = createPictureModel({ media, variant: 'profile' });
  assert.equal(model.available, true);
  assert.equal(model.sources.length, 2);
  assert.equal(model.fallback.src, '/media/p.jpg');
  assert.equal(model.width, 1024);
});
test('retrato só é usado quando aprovado', () => {
  const registry = [
    { author_slug: 'cora', status: 'pending' },
    { author_slug: 'vera', status: 'approved', derivatives: [] },
  ];
  assert.equal(portraitForAuthor(registry, 'cora'), null);
  assert.equal(portraitForAuthor(registry, 'vera').status, 'approved');
});
test('componentes declaram width height e crédito', async () => {
  const responsive = await readFile('src/components/media/ResponsiveImage.astro', 'utf8');
  const portrait = await readFile('src/components/media/Portrait.astro', 'utf8');
  assert.match(responsive, /width=\{picture\.width\}/);
  assert.match(responsive, /height=\{picture\.height\}/);
  assert.match(portrait, /portrait-placeholder/);
  assert.match(portrait, /portrait\.credit/);
});
