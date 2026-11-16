import { DocumentHead } from "./DocumentHead.tsx";
import { SiteLink } from "./SiteLink.tsx";
import { Container } from "./ui.tsx";

export function NotFound() {
  return (
    <Container className="py-20">
      <DocumentHead
        title="Страница не найдена | USAPARTS"
        description="Такой страницы на сайте USAPARTS нет. Вернитесь на главную или оставьте заявку на подбор запчасти."
        path="/404.html"
        robots="noindex, follow"
      />
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 max-w-3xl">Страница не найдена</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">
        Адреса нет среди разделов сайта. Откройте главную или напишите, какую деталь нужно найти.
      </p>
      <SiteLink href="/" className="btn btn-primary mt-6">
        На главную
      </SiteLink>
    </Container>
  );
}
