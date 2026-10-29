import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import test from 'node:test';

import { classifyUpload, isSafeDocumentId, ownsPublicId, publicIdFor, signCloudinaryParams } from './sign.ts';

test('signature uses sorted params and does not include the secret in the returned value', () => {
  const params = {
    timestamp: 1700000000,
    public_id: 'users/abc/expenses/expense-id/item-id/file-id',
    type: 'authenticated',
    overwrite: 'false',
  };
  const signature = signCloudinaryParams(params, 'super-secret');
  const expected = createHash('sha1')
    .update(
      'overwrite=false&public_id=users/abc/expenses/expense-id/item-id/file-id&timestamp=1700000000&type=authenticatedsuper-secret',
    )
    .digest('hex');
  assert.equal(signature, expected);
  assert.equal(signature.includes('super-secret'), false);
  assert.equal(signature, signCloudinaryParams({ overwrite: 'false', type: 'authenticated', public_id: params.public_id, timestamp: params.timestamp }, 'super-secret'));
});

test('upload classification rejects public and oversized files', () => {
  assert.deepEqual(classifyUpload('application/pdf', 1024), { resourceType: 'raw' });
  assert.deepEqual(classifyUpload('image/jpeg', 1024), { resourceType: 'image' });
  assert.equal(classifyUpload('image/gif', 1024), null);
  assert.equal(classifyUpload('application/pdf', 16 * 1024 * 1024), null);
  assert.equal(classifyUpload('image/png', 0), null);
});

test('public ids stay inside the signed-in user prefix', () => {
  const publicId = publicIdFor('user_1', 'expense-id1', 'item-id-1', 'file-id-1');
  assert.equal(ownsPublicId('user_1', publicId), true);
  assert.equal(ownsPublicId('user_2', publicId), false);
  assert.equal(ownsPublicId('user_1', 'users/user_1/../../other'), false);
  assert.equal(isSafeDocumentId('expense-id1'), true);
  assert.equal(isSafeDocumentId('../etc'), false);
});
