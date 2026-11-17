import Script from "next/script";
import { Suspense } from "react";
import { getSeoAnalyticsIds } from "@/modules/seo/settings";
import { AttributionCapture } from "@/components/analytics/attribution-capture";

/**
 * Injects GA4 / Metrika only when IDs are configured (env or SeoSettings).
 * Empty IDs → no scripts, no network. Measurement IDs also appear as head meta via layout metadata.
 */
export async function AnalyticsBootstrap() {
  let ga4: string | null = null;
  let metrika: string | null = null;
  try {
    const ids = await getSeoAnalyticsIds();
    ga4 = ids.ga4MeasurementId;
    metrika = ids.yandexMetrikaId;
  } catch {
    return (
      <Suspense fallback={null}>
        <AttributionCapture />
      </Suspense>
    );
  }

  return (
    <>
      {ga4 ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`}
            strategy="afterInteractive"
          />
          <Script id="europart-ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga4)},{send_page_view:false,anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {metrika ? (
        <>
          <Script id="europart-metrika-init" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${JSON.stringify(metrika)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height={1}
              src={`https://mc.yandex.ru/watch/${encodeURIComponent(metrika)}`}
              style={{ position: "absolute", left: -9999 }}
              width={1}
            />
          </noscript>
        </>
      ) : null}
      <Suspense fallback={null}>
        <AttributionCapture />
      </Suspense>
    </>
  );
}
