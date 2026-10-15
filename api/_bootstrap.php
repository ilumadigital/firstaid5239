<?php
declare(strict_types=1);

// This file is executed only by the two public API entrypoints.
// public_html/api -> public_html -> private domain directory containing .env.
function appConfig(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $config = [];
    $envPath = dirname(__DIR__, 2) . '/.env';
    if (!is_file($envPath) || !is_readable($envPath)) {
        error_log('Firstaid5239: private .env file is missing or not readable');
        return $config;
    }
    foreach (file($envPath, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!preg_match('/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/', $line, $matches)) {
            continue;
        }
        $value = trim($matches[2]);
        if (strlen($value) >= 2 && (
            ($value[0] === '"' && str_ends_with($value, '"')) ||
            ($value[0] === "'" && str_ends_with($value, "'"))
        )) {
            $value = substr($value, 1, -1);
        }
        $config[$matches[1]] = $value;
    }
    return $config;
}

function appEnv(string $key, string $fallback = ''): string
{
    return appConfig()[$key] ?? $fallback;
}

function sendJson(int $code, array $payload): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
