import path from 'path';
import fsp from 'fs/promises';
import * as prettier from 'prettier';
import debug from 'debug';
import axios from 'axios';

export const logger = debug('page-loader');

export const fetchData = (url: string) => axios.get(url, { responseType: 'arraybuffer' })
  .then((response) => response.data);

export const buildPath = (...args: string[]) => path.join(...args);

export const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-$/, '');

export const prettifyHTML = (html: string) => prettier.format(html, { parser: 'html', tabWidth: 2, printWidth: 600 });

export const buildFileName = (hostname: string, src: string) => {
  const url = buildPath(hostname, src);
  const ext = path.extname(url) || '.html';

  return sanitizeFileName(url.replace(ext, '')).concat(ext);
};

export const saveFile = (filepath: string, data: string) => (
  fsp.writeFile(filepath, data, { encoding: null })
);
