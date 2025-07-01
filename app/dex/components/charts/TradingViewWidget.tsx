"use client";
// TradingViewWidget.tsx
import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget() {
  // Typing the ref correctly to indicate it can be a HTMLDivElement or null
  const container = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Cleanup any previously appended script to avoid duplicates
    if (
      scriptRef.current &&
      container.current &&
      container.current.contains(scriptRef.current)
    ) {
      container.current.removeChild(scriptRef.current);
    }

    // Only append the script if container is available
    if (container.current) {
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
            {
  "autosize": false,
  "symbol": "BINANCE:AVAXUSDT",
  "interval": "D",
  "timezone": "Etc/UTC",
  "theme": "light",
  "style": "1",
  "locale": "en",
  "allow_symbol_change": true,
  "calendar": false,
  "support_host": "https://www.tradingview.com"
}
`;

      // Store the script reference so we can remove it later if needed
      container.current.appendChild(script);
      scriptRef.current = script;
    }

    // Cleanup on component unmount
    return () => {
      if (
        scriptRef.current &&
        container.current &&
        container.current.contains(scriptRef.current)
      ) {
        container.current.removeChild(scriptRef.current);
      }
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    ></div>
  );
}

export default memo(TradingViewWidget);
