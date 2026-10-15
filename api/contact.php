<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    sendJson(405, ['ok' => false, 'message' => 'Επιτρέπεται μόνο POST.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower(explode(':', (string)($_SERVER['HTTP_HOST'] ?? ''))[0]);
if ($origin !== '') {
    $originHost = strtolower((string)parse_url($origin, PHP_URL_HOST));
    if ($originHost === '' || !hash_equals($host, $originHost)) {
        sendJson(403, ['ok' => false, 'message' => 'Μη επιτρεπόμενο αίτημα.']);
    }
}
if (!str_contains(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    sendJson(415, ['ok' => false, 'message' => 'Μη υποστηριζόμενος τύπος δεδομένων.']);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 12000) {
    sendJson(413, ['ok' => false, 'message' => 'Το αίτημα είναι πολύ μεγάλο.']);
}
$raw = file_get_contents('php://input', false, null, 0, 12001);
if ($raw === false || strlen($raw) > 12000) {
    sendJson(413, ['ok' => false, 'message' => 'Το αίτημα είναι πολύ μεγάλο.']);
}
try {
    $data = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    sendJson(400, ['ok' => false, 'message' => 'Μη έγκυρα δεδομένα.']);
}
if (!is_array($data) || array_is_list($data)) {
    sendJson(400, ['ok' => false, 'message' => 'Μη έγκυρα δεδομένα.']);
}
function fieldValue(array $data, string $key, int $max): string
{
    if (!isset($data[$key])) {
        return '';
    }
    if (!is_string($data[$key]) && !is_int($data[$key])) {
        sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρα στοιχεία φόρμας.']);
    }
    $value = trim((string)$data[$key]);
    if (strlen($value) > $max * 4 || !preg_match('//u', $value)) {
        sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρα στοιχεία φόρμας.']);
    }
    if ((function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : preg_match_all('/./us', $value)) > $max) {
        sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρα στοιχεία φόρμας.']);
    }
    return $value;
}
if (fieldValue($data, 'website', 200) !== '') {
    sendJson(200, ['ok' => true]); // Honeypot: silently ignore bot submissions.
}
$company = fieldValue($data, 'company', 140);
$name = fieldValue($data, 'name', 100);
$role = fieldValue($data, 'role', 100);
$email = fieldValue($data, 'email', 254);
$phone = fieldValue($data, 'phone', 35);
$city = fieldValue($data, 'city', 100);
$employees = fieldValue($data, 'employees', 10);
$program = fieldValue($data, 'program', 80);
$message = fieldValue($data, 'message', 2000);
if ($company === '' || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || $phone === '' || strlen($phone) < 7 || ($data['privacyAccepted'] ?? false) !== true) {
    sendJson(422, ['ok' => false, 'message' => 'Συμπληρώστε τα υποχρεωτικά πεδία και αποδεχθείτε την ενημέρωση απορρήτου.']);
}
if (preg_match('/[\r\n]/', $company . $name . $email . $phone)) {
    sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρα στοιχεία επικοινωνίας.']);
}
if ($employees !== '' && (!ctype_digit($employees) || (int)$employees < 1 || (int)$employees > 1000000)) {
    sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρος αριθμός εργαζομένων.']);
}
if (!in_array($program, ['', 'Workplace Compliance', 'Workplace Safety Plus'], true)) {
    sendJson(422, ['ok' => false, 'message' => 'Μη έγκυρη επιλογή προγράμματος.']);
}

$secret = appEnv('TURNSTILE_SECRET_KEY');
$siteKey = appEnv('TURNSTILE_SITE_KEY');
$token = fieldValue($data, 'cf-turnstile-response', 2048);
if ($secret === '' || $siteKey === '' || $token === '') {
    sendJson(422, ['ok' => false, 'message' => 'Ο έλεγχος ασφαλείας Turnstile δεν ολοκληρώθηκε. Ανανεώστε τη φόρμα.']);
}
if (!function_exists('curl_init')) {
    error_log('Firstaid5239: PHP cURL extension is unavailable');
    sendJson(503, ['ok' => false, 'message' => 'Ο έλεγχος ασφαλείας δεν είναι διαθέσιμος.']);
}
$curl = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
if ($curl === false) {
    sendJson(503, ['ok' => false, 'message' => 'Ο έλεγχος ασφαλείας δεν είναι διαθέσιμος.']);
}
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => (string)($_SERVER['REMOTE_ADDR'] ?? '')
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['Accept: application/json']
]);
$verifyResponse = curl_exec($curl);
$verifyCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);
$verified = is_string($verifyResponse) ? json_decode($verifyResponse, true) : null;
$allowedHosts = array_values(array_filter(array_map(
    'trim', explode(',', strtolower(appEnv('TURNSTILE_ALLOWED_HOSTNAMES', 'firstaid5239.gr,www.firstaid5239.gr')))
)));
$turnstileHost = strtolower((string)($verified['hostname'] ?? ''));
if ($verifyCode !== 200 || !is_array($verified) || ($verified['success'] ?? false) !== true ||
    $turnstileHost === '' || !in_array($turnstileHost, $allowedHosts, true)) {
    sendJson(403, ['ok' => false, 'message' => 'Ο έλεγχος Turnstile απέτυχε ή έληξε. Δοκιμάστε ξανά.']);
}

$smtpHost = appEnv('SMTP_HOST', 'smtp.hostinger.com');
$smtpPort = (int)appEnv('SMTP_PORT', '465');
$smtpUser = appEnv('SMTP_USER');
$smtpPassword = appEnv('SMTP_PASSWORD');
$from = appEnv('MAIL_FROM', $smtpUser);
$to = appEnv('MAIL_TO', 'info@enak.gr');
$vendorPath = dirname(__DIR__, 2) . '/vendor/autoload.php';
$configurationIssues = [];
if ($smtpHost === '') {
    $configurationIssues[] = 'SMTP_HOST missing';
}
if (!in_array($smtpPort, [465, 587], true)) {
    $configurationIssues[] = 'SMTP_PORT invalid (expected 465 or 587)';
}
if ($smtpUser === '') {
    $configurationIssues[] = 'SMTP_USER missing';
}
if ($smtpPassword === '') {
    $configurationIssues[] = 'SMTP_PASSWORD missing';
}
if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
    $configurationIssues[] = 'MAIL_FROM invalid';
}
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $configurationIssues[] = 'MAIL_TO invalid';
}
if (!is_file($vendorPath)) {
    $configurationIssues[] = 'PHPMailer vendor/autoload.php missing outside public_html';
}
if ($configurationIssues !== []) {
    // Private PHP error log only: never echo configuration state, passwords or filesystem paths.
    error_log('Firstaid5239 setup: ' . implode('; ', $configurationIssues));
    sendJson(503, ['ok' => false, 'message' => 'Η υπηρεσία email δεν είναι ακόμη διαθέσιμη. Καλέστε στο 210 9575 470.']);
}
require_once $vendorPath;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function mailLayout(string $title, string $body): string
{
    return '<!doctype html><html lang="el"><head><meta charset="utf-8"></head><body style="margin:0;padding:28px;background:#f5f6f6;font-family:Arial,sans-serif;color:#24323b">'
      . '<div style="max-width:640px;margin:auto;background:white;padding:30px;border-top:5px solid #b9454c">'
      . '<h1 style="font-size:23px">' . esc($title) . '</h1>' . $body
      . '<p style="font-size:12px;color:#68757e;border-top:1px solid #eee;padding-top:20px;margin-top:28px">'
      . 'ΕΝΑΚ – Ελληνική Ναυαγοσωστική Ακαδημία | 210 9575 470 | info@enak.gr</p></div></body></html>';
}
function newMailer(string $smtpHost, int $smtpPort, string $smtpUser, string $smtpPassword, string $from): \PHPMailer\PHPMailer\PHPMailer
{
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->Port = $smtpPort;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPassword;
    $mail->SMTPSecure = $smtpPort === 465
        ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Timeout = 15;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($from, 'ΕΝΑΚ');
    $mail->isHTML(true);
    return $mail;
}

$details = [
    'Επωνυμία επιχείρησης' => $company, 'Ονοματεπώνυμο' => $name, 'Θέση / Τμήμα' => $role,
    'Email' => $email, 'Τηλέφωνο' => $phone, 'Πόλη' => $city,
    'Εργαζόμενοι ανά εγκατάσταση' => $employees, 'Πρόγραμμα' => $program, 'Σχόλια' => $message
];
$rows = '';
$plain = "Νέο αίτημα εκπαίδευσης από firstaid5239.gr\n\n";
foreach ($details as $label => $value) {
    $rows .= '<tr><td style="padding:9px;border-bottom:1px solid #eee;vertical-align:top">' . esc($label)
        . '</td><td style="padding:9px;border-bottom:1px solid #eee;white-space:pre-wrap">' . esc($value ?: '—') . '</td></tr>';
    $plain .= $label . ': ' . ($value ?: '—') . "\n";
}
try {
    $admin = newMailer($smtpHost, $smtpPort, $smtpUser, $smtpPassword, $from);
    $admin->addAddress($to);
    $admin->addReplyTo($email, $name);
    $admin->Subject = 'Νέο αίτημα Ν. 5239/2025 | ' . $company;
    $admin->Body = mailLayout('Νέο αίτημα εκπαίδευσης', '<p>Αίτημα προσφοράς από firstaid5239.gr</p><table style="width:100%;border-collapse:collapse">' . $rows . '</table>');
    $admin->AltBody = $plain;
    $admin->send();
} catch (\Throwable $e) {
    error_log('Firstaid5239: SMTP admin delivery rejected (' . get_class($e) . ')');
    sendJson(502, ['ok' => false, 'message' => 'Δεν ολοκληρώθηκε η αποστολή. Δοκιμάστε ξανά ή καλέστε στο 210 9575 470.']);
}
try {
    $client = newMailer($smtpHost, $smtpPort, $smtpUser, $smtpPassword, $from);
    $client->addAddress($email, $name);
    $client->addReplyTo($to);
    $client->Subject = 'Επιβεβαίωση αιτήματος | ΕΝΑΚ – Ν. 5239/2025';
    $client->Body = mailLayout('Λάβαμε το αίτημά σας',
        '<p>Αγαπητέ/ή ' . esc($name) . ',</p><p>Σας ευχαριστούμε για το ενδιαφέρον σας για την εκπαίδευση ΚΑΡΠΑ και λαβής Χάιμλιχ.</p>'
        . '<p>Η ΕΝΑΚ έλαβε το αίτημά σας για την επιχείρηση <strong>' . esc($company) . '</strong> και θα επικοινωνήσει μαζί σας.</p>'
        . '<p>Για άμεση επικοινωνία: 210 9575 470 ή info@enak.gr.</p><p>Η ομάδα της ΕΝΑΚ</p>');
    $client->AltBody = "Αγαπητέ/ή $name,\n\nΗ ΕΝΑΚ έλαβε το αίτημά σας για την επιχείρηση $company. Θα επικοινωνήσουμε μαζί σας.\n\nΕΝΑΚ | 210 9575 470 | info@enak.gr";
    $client->send();
} catch (\Throwable $e) {
    error_log('Firstaid5239: SMTP customer confirmation failed (' . get_class($e) . ')');
    sendJson(502, ['ok' => false, 'message' => 'Το αίτημα στάλθηκε στην ΕΝΑΚ, αλλά δεν κατέστη δυνατή η επιβεβαίωση στο email σας. Μην το υποβάλετε ξανά· καλέστε στο 210 9575 470.']);
}
sendJson(200, ['ok' => true, 'message' => 'Το αίτημα και η επιβεβαίωση έγιναν αποδεκτά από τον SMTP server.']);
