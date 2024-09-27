import path from 'path';
import fsp from 'fs/promises';
import * as prettier from 'prettier';
import { createRequire } from 'module';
import debug from 'debug';
import NetworkError from './errors/NetworkError.js';
import FileSystemError from './errors/FileSystemError.js';

const require = createRequire(import.meta.url);

require('axios-debug-log');

const axios = require('axios');

export const logger = debug('page-loader');

export const fetchData = (url) => axios({
  url,
  method: 'get',
  responseType: 'arraybuffer',
})
  .then((response) => response.data)
  .catch((error) => {
    throw new NetworkError(error, url);
  });

export const buildPath = (...args) => path.join(...args);

export const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-$/, '');

export const prettifyHTML = (html) => prettier.format(html, { parser: 'html', tabWidth: 2, printWidth: 600 });

export const buildFileName = (hostname, src) => {
  const url = buildPath(hostname, src);
  const ext = path.extname(url) || '.html';

  return sanitizeFileName(url.replace(ext, '')).concat(ext);
};

export const saveFile = (filepath, data) => fsp.writeFile(filepath, data, { encoding: null })
  .catch((error) => {
    throw new FileSystemError(error);
  });

export const accessDir = (dirpath) => fsp.access(dirpath)
  .catch((error) => {
    throw new FileSystemError(error);
  });

export const makeDir = (dirpath) => fsp.mkdir(dirpath)
  .catch((error) => {
    throw new FileSystemError(error);
  });
