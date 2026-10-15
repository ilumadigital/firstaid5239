<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    sendJson(405, ['ok' => false, 'message' => 'Επιτρέπεται μόνο GET.']);
}

$siteKey = appEnv('TURNSTILE_SITE_KEY');
$secretKey = appEnv('TURNSTILE_SECRET_KEY');
if ($siteKey === '' || $secretKey === '') {
    sendJson(503, ['ok' => false, 'message' => 'Η προστασία της φόρμας δεν έχει ρυθμιστεί.']);
}
// TURNSTILE_SITE_KEY is explicitly public. Never expose secret, mail credentials or the file path.
sendJson(200, ['ok' => true, 'turnstileSiteKey' => $siteKey]);
