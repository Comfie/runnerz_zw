import { put } from "@vercel/blob"

export async function uploadEventImage(prefix: string, file: File) {
  const safeName = file.name.replace(/[^\w.-]/g, "_")
  const blob = await put(`${prefix}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  })
  return blob.url
}
