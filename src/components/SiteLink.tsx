import type { MouseEvent, ReactNode } from "react";
import { track, type AnalyticsEvent } from "../lib/analytics.ts";

type SiteLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  event?: AnalyticsEvent;
  eventParams?: Record<string, string>;
  onClick?: () => void;
};

export function SiteLink({ href, className, children, ariaLabel, event, eventParams, onClick }: SiteLinkProps) {
  const onNavigate = (mouseEvent: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (event) track(event, eventParams);
    if (mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.shiftKey || mouseEvent.altKey || mouseEvent.button !== 0) return;
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    mouseEvent.preventDefault();
    const next = `${url.pathname}${url.search}${url.hash}`;
    const same = url.pathname === window.location.pathname;
    if (!same) window.history.pushState(null, "", next);
    else window.history.replaceState(null, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
    if (url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (same) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <a href={href} className={className} aria-label={ariaLabel} onClick={onNavigate}>
      {children}
    </a>
  );
}
