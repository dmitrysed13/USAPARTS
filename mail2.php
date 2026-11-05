<?php
require_once __DIR__ . '/mail_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: index.html');
	exit;
}

$subject = az_clean(az_post('subject'));
$name    = az_clean(az_post('name'));
$phone   = az_clean(az_post('phone'));
$marka   = az_clean(az_post('marka'));

if ($name === '' || $phone === '' || $marka === '') {
	http_response_code(400);
	echo 'Заполните обязательные поля.';
	exit;
}

az_send_mail([
	'Тема: Заявка.',
	'Форма отправки: ' . $subject,
	'Телефон: ' . $phone,
	'Имя: ' . $name,
	'Марка автомобиля: ' . $marka,
]);

az_render_thanks();
