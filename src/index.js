import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';

const fetchPageData = (url) => axios.get(url)
  .then((response) => response.data)
  .catch((error) => {
    throw error;
  });

const getFileNameFromUrl = (url) => {
  const [, urlWithoutScheme] = url.split('://');
  const filename = urlWithoutScheme.split(/[^a-zA-Z0-9]/).join('-').concat('.html');

  return filename;
};

const savePage = (filepath, data) => {
  fsp.writeFile(filepath, data);
};

export default (url, dirname) => {
  const filename = getFileNameFromUrl(url);
  const fullpath = path.join(dirname, filename);

  return fetchPageData(url)
    .then((data) => savePage(fullpath, data))
    .then(() => fullpath);
};
