import path from 'path';
import fsp from 'fs/promises';
import * as prettier from 'prettier';
import { createRequire } from 'module';
import debug from 'debug';

const require = createRequire(import.meta.url);

require('axios-debug-log');

const axios = require('axios');

export const logger = debug('page-loader');

export const fetchData = (url, options = {}) => {
  logger(`Fetch data from ${url}`);

  return axios.get(url, options)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });
};

export const buildPath = (...args) => path.join(...args);

export const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9]/g, '-');

export const prettifyHTML = (html) => prettier.format(html, { parser: 'html', tabWidth: 2, printWidth: 600 });

export const buildFileName = (hostname, src) => {
  const url = buildPath(hostname, src);
  const ext = path.extname(url) || '.html';

  return sanitizeFileName(url.replace(ext, '')).concat(ext);
};

export const readFile = (filepath, options = { encoding: 'utf-8' }) => fsp.readFile(filepath, options);

export const saveFile = (filepath, data) => fsp.writeFile(filepath, data);

export const makeDir = (dirpath) => fsp.mkdir(dirpath, { recursive: true });
