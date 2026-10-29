import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { checkImage, recommendModel } from './index.mjs';

test('rejects image dimensions outside the published limits', () => {
  assert.equal(checkImage({ format: 'jpg', sizeBytes: 1000000, width: 100, height: 100 }).acceptedByPublishedLimits, true);
  assert.equal(checkImage({ format: 'heic', sizeBytes: 21000000, width: 6000, height: 5000 }).errors.length, 3);
});
test('prioritizes faithful review of text and faces', () => {
  assert.equal(recommendModel({ blurType: 'motion', severity: 'heavy', containsTextOrFaces: true }).suggestedFirstTry, 'Basic');
  assert.equal(recommendModel({ blurType: 'intentional-obscuring', severity: 'heavy', containsTextOrFaces: false }).suggestedFirstTry, 'none');
});
test('MCP client can call preflight tool', async () => {
  const client = new Client({ name: 'imageunblur-test', version: '0.1.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [new URL('./index.mjs', import.meta.url).pathname] }));
  try {
    assert.equal((await client.listTools()).tools.length, 3);
    const result = await client.callTool({ name: 'check_image_metadata', arguments: { format: 'png', sizeBytes: 2000000, width: 1200, height: 800 } });
    assert.equal(JSON.parse(result.content[0].text).acceptedByPublishedLimits, true);
  } finally { await client.close(); }
});
