import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

test('Hostinger PHP + Turnstile artifacts are included in the deployable build', async () => {
  const js=await readFile('dist/script.js','utf8');
  const contact=await readFile('dist/api/contact.php','utf8');
  const config=await readFile('dist/api/config.php','utf8');
  const bootstrap=await readFile('dist/api/_bootstrap.php','utf8');
  const htaccess=await readFile('dist/api/.htaccess','utf8');
  assert.match(js,/api\/config\.php/);
  assert.match(js,/api\/contact\.php/);
  assert.match(js,/turnstile\.getResponse/);
  assert.match(contact,/challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.match(contact,/TURNSTILE_SECRET_KEY/);
  assert.match(contact,/SMTP_PASSWORD/);
  assert.match(contact,/vendor\/autoload\.php/);
  assert.match(config,/turnstileSiteKey/);
  assert.ok(!config.includes("'SMTP_PASSWORD'"));
  assert.match(bootstrap,/dirname\(__DIR__, 2\) \. '\/\.env'/);
  assert.match(htaccess,/Require all denied/);
  await assert.rejects(access('dist/.env'),{code:'ENOENT'});
});
