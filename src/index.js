import axios from 'axios';
import fs from 'fs';
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

const fetchHTML = (url) => axios.get(url)
  .then((response) => response.data)
  .catch((error) => {
    throw error;
  });

const fetchImage = (url, output) => axios.get(url, { responseType: 'stream' })
  .then((response) => response.data.pipe(fs.createWriteStream(output)));

const parseName = (name) => name.replace(/[^a-zA-Z0-9]/g, '-');

const savePage = (filepath, html) => fsp.writeFile(filepath, html);

const makeResourcesDir = (root, dirname) => (
  fsp.mkdir(path.join(root, dirname))
);

const saveImages = (root, hostname, filesDirName, htmlPath) => fsp.readFile(htmlPath, 'utf-8')
  .then((html) => {
    const $ = cheerio.load(html);

    $('img').each((_i, elem) => {
      const link = elem.attribs.src;
      const extname = path.extname(link);
      const dirname = path.dirname(link);
      const basename = path.basename(link, extname);
      const imgName = parseName(path.join(hostname, dirname, basename)).concat(extname);
      const imgPath = path.join(root, filesDirName, imgName);

      // eslint-disable-next-line no-param-reassign
      elem.attribs.src = path.join(filesDirName, imgName);

      if (link.startsWith('http')) {
        return fetchImage(link, imgPath);
      }

      return fsp.readFile(path.join(process.cwd(), link))
        .then((data) => fsp.writeFile(imgPath, data));
    });

    return Promise.resolve($.html());
  })
  .then((html) => prettifyHTML(html))
  .then((html) => fsp.writeFile(htmlPath, html));

export default (url, root) => {
  const { hostname, pathname } = new URL(url);
  const htmlName = parseName(path.join(hostname, pathname)).concat('.html');
  const resourcesDirName = parseName(path.join(hostname, pathname)).concat('_files');
  const htmlPath = path.join(root, htmlName);

  return fetchHTML(url)
    .then((html) => savePage(htmlPath, html))
    .then(() => makeResourcesDir(root, resourcesDirName))
    .then(() => saveImages(root, hostname, resourcesDirName, htmlPath))
    .then(() => htmlPath);
};
