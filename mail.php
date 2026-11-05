<?php
require_once __DIR__ . '/mail_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: index.html');
	exit;
}

$subject  = az_clean(az_post('subject'));
$name     = az_clean(az_post('name'));
$phone    = az_clean(az_post('phone'));
$vin      = az_clean(az_post('vin'));
$zapchast = az_clean(az_post('zapchast'));

if ($name === '' || $phone === '') {
	http_response_code(400);
	echo 'Заполните обязательные поля: имя и телефон.';
	exit;
}

az_send_mail([
	'Тема: Заявка.',
	'Форма отправки: ' . $subject,
	'Телефон: ' . $phone,
	'Имя: ' . $name,
	'VIN кузова: ' . $vin,
	'Название запчасти: ' . $zapchast,
]);

az_render_thanks();
