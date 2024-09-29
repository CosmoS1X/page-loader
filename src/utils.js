import path from 'path';
import fsp from 'fs/promises';
import * as prettier from 'prettier';
import { createRequire } from 'module';
import debug from 'debug';

const require = createRequire(import.meta.url);

require('axios-debug-log');

const axios = require('axios');

export const logger = debug('page-loader');

export const fetchData = (url) => axios.get(url, { responseType: 'arraybuffer' })
  .then((response) => response.data);

export const buildPath = (...args) => path.join(...args);

export const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-$/, '');

export const prettifyHTML = (html) => prettier.format(html, { parser: 'html', tabWidth: 2, printWidth: 600 });

export const buildFileName = (hostname, src) => {
  const url = buildPath(hostname, src);
  const ext = path.extname(url) || '.html';

  return sanitizeFileName(url.replace(ext, '')).concat(ext);
};

export const saveFile = (filepath, data) => fsp.writeFile(filepath, data, { encoding: null });

export const accessDir = (dirpath) => fsp.access(dirpath);

export const makeDir = (dirpath) => fsp.mkdir(dirpath);
