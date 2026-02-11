
export const uploadFileToCloudinary = async (file: File, signal?: AbortSignal) => {
  const sigRes = await fetch("/api/cloudinary-signature");
  if (!sigRes.ok) {
    throw new Error("Failed to get upload signature");
  }
  const signature = await sigRes.json();
  const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder ?? "sketch-design-with-ai");

  const uploadRes = await fetch(uploadApi, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!uploadRes.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await uploadRes.json();
  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    resourceType: data.resource_type as string,
  };
};
