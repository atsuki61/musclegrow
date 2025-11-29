declare module "downloadjs" {
  export default function download(
    data: Blob | File | string | Uint8Array,
    strFileName?: string,
    strMimeType?: string
  ): boolean;
}
