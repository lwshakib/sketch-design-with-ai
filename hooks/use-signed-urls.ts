import { useState, useEffect } from "react";

export const useSignedUrls = (paths: string[]) => {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUrls = async () => {
      const pathsToFetch = paths.filter((p) => p && !urlMap[p] && !p.startsWith("http"));
      if (pathsToFetch.length === 0) return;

      setLoading(true);
      try {
        const res = await fetch("/api/s3/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: pathsToFetch }),
        });

        if (res.ok) {
          const { urls } = await res.json();
          const newMap = { ...urlMap };
          pathsToFetch.forEach((path, i) => {
            if (urls[i]) newMap[path] = urls[i];
          });
          setUrlMap(newMap);
        }
      } catch (error) {
        console.error("Failed to resolve signed URLs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, [paths]);

  return { urlMap, loading };
};
