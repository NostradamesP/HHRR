import { useEffect, useState } from "react";
import { defaultItConfig } from "../../constants/defaultItConfig";
import { LOCAL_IT_CONFIG_KEY } from "../../constants/storage";
import { readLocalJSON, writeLocalJSON, cleanValue } from "../../lib/utils";

/**
 * useItConfig — config IT (catálogos), persistencia local y alta de valores.
 * useItConfig — IT config (catalogs), local persistence and catalog value creation.
 */
export function useItConfig({ isLocalDemo }) {
  const [itConfig, setItConfig] = useState(() =>
    readLocalJSON(LOCAL_IT_CONFIG_KEY, defaultItConfig),
  );

  useEffect(() => {
    if (!isLocalDemo) return;
    writeLocalJSON(LOCAL_IT_CONFIG_KEY, itConfig);
  }, [itConfig, isLocalDemo]);

  function addCatalogValue(key, value) {
    const clean = cleanValue(value);
    if (!clean) return;
    setItConfig((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      if (current.some((item) => item.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, [key]: [...current, clean] };
    });
  }

  return { itConfig, setItConfig, addCatalogValue };
}
