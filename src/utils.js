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

export const fetchData = (url, options = {}) => {
  const ext = path.extname(url);

  return axios.get(url, options)
    .then(({ data }) => (ext === '.json' ? JSON.stringify(data, null, 2) : data))
    .catch(({ code, message }) => {
      throw new NetworkError({ code, message }, url);
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

export const saveFile = (filepath, data) => fsp.writeFile(filepath, data)
  .catch((error) => {
    throw new FileSystemError(error);
  });

export const makeDir = (dirpath) => fsp.mkdir(dirpath, { recursive: true })
  .catch((error) => {
    throw new FileSystemError(error);
  });
