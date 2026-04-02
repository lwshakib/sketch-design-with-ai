export const uploadFileToS3 = async (
  file: File,
  folder: string = "attachments",
  signal?: AbortSignal,
) => {
  // Step 1: Get presigned URL from our API
  const res = await fetch("/api/s3/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      folder,
      fileName: file.name,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadUrl, path } = await res.json();

  // Step 2: Upload file directly to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
    signal,
  });

  if (!uploadRes.ok) {
    throw new Error("S3 upload failed");
  }

  return { path };
};
