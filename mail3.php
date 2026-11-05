<?php
require_once __DIR__ . '/mail_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: index.html');
	exit;
}

$subject   = az_clean(az_post('subject'));
$name      = az_clean(az_post('name'));
$phone     = az_clean(az_post('phone'));
$userEmail = az_clean(az_post('email'));

if ($name === '' || $phone === '' || $userEmail === '') {
	http_response_code(400);
	echo 'Заполните обязательные поля.';
	exit;
}

if (!filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
	http_response_code(400);
	echo 'Укажите корректный E-mail.';
	exit;
}

az_send_mail([
	'Тема: Заявка.',
	'Форма отправки: ' . $subject,
	'Телефон: ' . $phone,
	'Имя: ' . $name,
	'Email: ' . $userEmail,
]);

az_render_thanks();
