declare module 'html-pdf-node' {
  interface Options {
    format?: 'A4' | 'Letter' | string;
    orientation?: 'portrait' | 'landscape';
    margin?: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    scale?: number;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    printBackground?: boolean;
    pageRanges?: string;
    landscape?: boolean;
    width?: string | number;
    height?: string | number;
    preferCSSPageSize?: boolean;
    omitBackground?: boolean;
    timeout?: number;
  }

  interface File {
    content?: string;
    url?: string;
  }

  function generatePdf(files: File | File[], options?: Options): Promise<Buffer>;

  export { generatePdf, Options, File };
}
