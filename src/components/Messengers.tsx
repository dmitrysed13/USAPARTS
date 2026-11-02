import { company } from "../content.ts";

export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M21.4 4.3 2.8 11.2c-.9.4-.9 1.1-.1 1.4l4.7 1.5 1.8 5.6c.2.7.9.9 1.4.4l2.7-2.6 4.6 3.4c.6.4 1.4.1 1.6-.6l2.8-13.2c.3-1.2-.5-1.8-1.5-1.4ZM8.7 13.7l9.2-6c.4-.2.7 0 .4.3l-7.7 7.1.3 3.1-1.7-4.5Z"
      />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12.1 3.2a8.6 8.6 0 0 0-7.4 12.9L3.6 20.7l4.7-1.2a8.6 8.6 0 1 0 3.8-16.3Zm4.7 12.2c-.2.6-1.1 1-1.6 1.1-.4 0-.9.2-3-.7-2.5-1-4.1-3.5-4.3-3.7-.1-.2-1-1.3-1-2.5s.6-1.7.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .3 0 .5.4.2.6.8 1.9.8 2.1 0 .2 0 .3-.2.5l-.3.4c-.1.2-.3.3-.1.6.2.3.8 1.2 1.6 1.9 1 .8 1.9.9 2.2.7.2-.2.4-.4.6-.3.3.1 1.6.8 1.8.9.3.2.4.3.3.6Z"
      />
    </svg>
  );
}

export function ViberIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M7.8 3.4h.6c.7.1 1.3.6 1.4 1.3.2 1.2.5 2.3.8 3.2.2.6 0 1.2-.5 1.6l-1.3 1a12 12 0 0 0 5.7 5.7l1-1.3c.4-.5 1-.7 1.6-.5.9.3 2 .6 3.2.8.7.1 1.2.7 1.3 1.4v.6c.1 1.5-.7 2.6-2.1 3.1-1.5.5-3.2.6-4.8.2A16.7 16.7 0 0 1 4.5 9.7c-.4-1.6-.3-3.3.2-4.8.5-1.4 1.6-2.2 3.1-2.1Z"
      />
    </svg>
  );
}

const messengers = [
  { key: "telegram", href: company.telegram, label: "Telegram", tone: "bg-[#2AABEE]", icon: TelegramIcon },
  { key: "viber", href: company.viber, label: "Viber", tone: "bg-[#7360F2]", icon: ViberIcon },
  { key: "whatsapp", href: company.whatsapp, label: "WhatsApp", tone: "bg-[#25D366]", icon: WhatsAppIcon },
] as const;

export function MessengerLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {messengers.map((item) => (
        <a key={item.key} className="icon-btn" href={item.href} target="_blank" rel="noreferrer" aria-label={`Написать в ${item.label}`}>
          <item.icon />
        </a>
      ))}
    </div>
  );
}

export function SideMessengers() {
  return (
    <nav aria-label="Написать в мессенджер" className="fixed right-3 bottom-24 z-40 flex flex-col gap-2 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
      {messengers.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.label}: ${item.key === "telegram" ? "@dmitry_spa" : company.phoneDisplay}`}
          className={`grid h-12 w-12 place-items-center rounded-full text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)] transition hover:-translate-x-0.5 ${item.tone}`}
        >
          <item.icon />
        </a>
      ))}
    </nav>
  );
}
