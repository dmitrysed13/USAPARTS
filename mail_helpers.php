<?php
/**
 * Shared helpers for lead forms.
 */
function az_post($key) {
	return isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
}

function az_clean($value) {
	$value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
	return strip_tags($value);
}

function az_send_mail($bodyLines) {
	$address = 'dmitry.chanoff@gmail.com';
	$subject = 'Заказ с лендинга Автозапчасти';
	$from = 'landing@avtozapchasti.local';
	$body = implode("\n", $bodyLines);

	$headers = [
		'Content-Type: text/plain; charset=UTF-8',
		'From: ' . $from,
		'X-Mailer: PHP/' . phpversion(),
	];

	return @mail($address, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
}

function az_render_thanks() {
	?><!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
	<title>Заявка принята</title>
	<style>
		:root {
			--accent: #e11d2e;
			--ink: #1a1d21;
			--muted: #5c6570;
		}
		* { box-sizing: border-box; }
		body {
			margin: 0;
			font-family: "Manrope", "Segoe UI", sans-serif;
			color: var(--ink);
			background: #eef1f3;
		}
		.thankyou {
			min-height: 100vh;
			display: grid;
			place-items: center;
			padding: 2rem 1rem;
			text-align: center;
			background:
				url(img/operator.png) left 1.5rem bottom / auto no-repeat,
				url(img/city.jpg) center bottom / cover no-repeat #fff;
		}
		.card {
			max-width: 520px;
			padding: 2rem 1.5rem;
			border-radius: 16px;
			background: rgba(255, 255, 255, 0.94);
			box-shadow: 0 16px 40px rgba(15, 18, 22, 0.12);
		}
		h1 {
			margin: 0 0 1rem;
			font-size: clamp(1.6rem, 4vw, 2.2rem);
			color: #0aa150;
		}
		p { color: var(--muted); line-height: 1.5; }
		.button {
			display: inline-block;
			margin-top: 1rem;
			padding: 0.85rem 1.4rem;
			border-radius: 999px;
			background: var(--accent);
			color: #fff;
			font-weight: 700;
			text-decoration: none;
			box-shadow: 0 8px 20px rgba(225, 29, 46, 0.28);
		}
		.button:hover { background: #b31422; }
		@media (max-width: 700px) {
			.thankyou { background: #fff; }
		}
	</style>
</head>
<body>
	<div class="thankyou">
		<div class="card">
			<h1>Спасибо, заявка принята!</h1>
			<p>Оператор свяжется с вами в ближайшее время.</p>
			<p>Если вы допустили ошибку, вернитесь на страницу и оставьте заявку ещё раз.</p>
			<a href="index.html" class="button">Вернуться</a>
		</div>
	</div>
</body>
</html>
	<?php
}
