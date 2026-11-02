import { company } from "../content.ts";

export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M21.4 4.3 2.8 11.2c-.9.4-.9 1.1-.1 1.4l4.7 1.5 1.8 5.6c.2.7.9.9 1.4.4l2.7-2.6 4.6 3.4c.6.4 1.4.1 1.6-.6l2.8-13.2c.3-1.2-.5-1.8-1.5-1.4ZM8.7 13.7l9.2-6c.4-.2.7 0 .4.3l-7.7 7.1.3 3.1-1.7-4.5Z"
      />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M12.1 3.2a8.6 8.6 0 0 0-7.4 12.9L3.6 20.7l4.7-1.2a8.6 8.6 0 1 0 3.8-16.3Zm4.7 12.2c-.2.6-1.1 1-1.6 1.1-.4 0-.9.2-3-.7-2.5-1-4.1-3.5-4.3-3.7-.1-.2-1-1.3-1-2.5s.6-1.7.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .3 0 .5.4.2.6.8 1.9.8 2.1 0 .2 0 .3-.2.5l-.3.4c-.1.2-.3.3-.1.6.2.3.8 1.2 1.6 1.9 1 .8 1.9.9 2.2.7.2-.2.4-.4.6-.3.3.1 1.6.8 1.8.9.3.2.4.3.3.6Z"
      />
    </svg>
  );
}

export function MessengerLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a className="icon-btn" href={company.telegram} target="_blank" rel="noreferrer" aria-label="Написать в Telegram">
        <TelegramIcon />
      </a>
      <a className="icon-btn" href={company.whatsapp} target="_blank" rel="noreferrer" aria-label="Написать в WhatsApp">
        <WhatsAppIcon />
      </a>
    </div>
  );
}
