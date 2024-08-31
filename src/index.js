import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';

const fetchPageData = (url) => axios.get(url)
  .then((response) => response.data)
  .catch((error) => {
    throw error;
  });

const getFileNameFromUrl = (url) => {
  const urlWithoutScheme = url.replace(/https?:\/\//, '');
  const filename = urlWithoutScheme.replace(/[^a-zA-Z0-9]/g, '-').concat('.html');

  return filename;
};

const savePage = (filepath, data) => fsp.writeFile(filepath, data);

export default (url, dirname) => {
  const filename = getFileNameFromUrl(url);
  const fullpath = path.join(dirname, filename);

  return fetchPageData(url)
    .then((data) => savePage(fullpath, data))
    .then(() => fullpath);
};
