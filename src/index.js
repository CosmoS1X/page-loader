import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';

const prettifyHTML = (html) => {
  const options = {
    parser: 'html',
    tabWidth: 2,
  };

  return prettier.format(html, options);
};

const fetchData = (url, options = {}) => axios.get(url, options)
  .then((response) => response.data)
  .catch((error) => {
    throw error;
  });

const saveFile = (output, data) => fsp.writeFile(output, data);

const parseName = (name) => name.replace(/[^a-zA-Z0-9]/g, '-');

const makeResourcesDir = (root, dirname) => (
  fsp.mkdir(path.join(root, dirname))
);

const saveImages = (root, origin, hostname, filesDirName, htmlPath) => fsp.readFile(htmlPath, 'utf-8')
  .then((html) => {
    const $ = cheerio.load(html);

    $('img').each((_i, elem) => {
      const link = elem.attribs.src;
      const extname = path.extname(link);
      const dirname = path.dirname(link);
      const basename = path.basename(link, extname);
      const imgName = parseName(path.join(hostname, dirname, basename)).concat(extname);
      const imgUrl = `${origin}${link}`;
      const output = path.join(root, filesDirName, imgName);

      if (!link.startsWith('https')) {
        // eslint-disable-next-line no-param-reassign
        elem.attribs.src = path.join(filesDirName, imgName);
        return fetchData(imgUrl, { responseType: 'stream' })
          .then((buffer) => saveFile(output, buffer));
      }
    });

    return Promise.resolve($.html());
  })
  .then((html) => prettifyHTML(html))
  .then((html) => saveFile(htmlPath, html));

export default (url, root) => {
  const { origin, hostname, pathname } = new URL(url);
  const htmlName = parseName(path.join(hostname, pathname)).concat('.html');
  const resourcesDirName = parseName(path.join(hostname, pathname)).concat('_files');
  const htmlPath = path.join(root, htmlName);

  return fetchData(url)
    .then((html) => saveFile(htmlPath, html))
    .then(() => makeResourcesDir(root, resourcesDirName))
    .then(() => saveImages(root, origin, hostname, resourcesDirName, htmlPath))
    .then(() => htmlPath);
};
