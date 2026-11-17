<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const RECIPIENT_EMAIL = 'dmitry.chanoff@gmail.com';
const SITE_NAME = 'USAPARTS';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Метод не поддерживается.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function field(string $key): string
{
    $value = $_POST[$key] ?? '';
    return trim(is_string($value) ? $value : '');
}

function respond(bool $ok, string $message, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Honeypot for bots
if (field('website') !== '') {
    respond(true, 'Заявка принята — свяжемся с расчётом');
}

$name = field('name');
$phone = field('phone');
$car = field('car');
$vin = field('vin');
$mileage = field('mileage');
$item = field('item');

if ($name === '' || $phone === '' || $car === '' || $item === '') {
    respond(false, 'Заполните обязательные поля: имя, телефон, авто и описание детали.', 422);
}

if (mb_strlen($name) > 120 || mb_strlen($phone) > 40 || mb_strlen($car) > 160 || mb_strlen($item) > 4000) {
    respond(false, 'Слишком длинное значение в одном из полей.', 422);
}

if ($vin !== '' && (mb_strlen($vin) < 11 || mb_strlen($vin) > 17)) {
    respond(false, 'VIN должен содержать от 11 до 17 символов.', 422);
}

$subject = 'Новая заявка USAPARTS: запчасти из США';

$bodyLines = [
    'Новая заявка с сайта ' . SITE_NAME . ' (запчасти для авто из США)',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Авто (марка/модель/год): ' . $car,
    'VIN: ' . ($vin !== '' ? strtoupper($vin) : '—'),
    'Пробег, км: ' . ($mileage !== '' ? $mileage : '—'),
    '',
    'Артикул / описание детали:',
    $item,
    '',
    'Отправлено: ' . date('d.m.Y H:i:s'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
    'User-Agent: ' . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'),
];

$body = implode("\n", $bodyLines);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . SITE_NAME . ' <noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '>',
    'Reply-To: ' . $name . ' <noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '>',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail(RECIPIENT_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, 'Не удалось отправить заявку. Попробуйте позже или позвоните нам.', 500);
}

respond(true, 'Заявка отправлена — свяжемся с расчётом по запчастям из США в ближайшее время.');
