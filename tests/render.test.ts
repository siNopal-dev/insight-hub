import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Portal } from '../src/components/portal';
test('Untrusted report text stays text, never executable markup', () => {
  const report={id:'11111111-1111-4111-8111-111111111111',title:'<img src=x onerror=alert(1)>',category:'Penjualan',description:'<script>alert(1)</script>',embed_url:'https://app.powerbi.com/view?r=demo',created_at:'2026-01-01T00:00:00Z',updated_at:null};
  const html=renderToStaticMarkup(createElement(Portal,{reports:[report],embedHosts:['app.powerbi.com']}));
  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert(1)</script>')); assert.ok(!html.includes('onclick='));
});
