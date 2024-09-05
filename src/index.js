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

const makeResourcesDir = (root, dirname) => fsp.mkdir(path.join(root, dirname));

const buildImgName = (hostname, src) => {
  const link = path.join(hostname, src);
  const ext = path.extname(link);

  return parseName(link.replace(ext, '')).concat(ext);
};

const savePage = (output, html) => prettifyHTML(html)
  .then((data) => saveFile(output, data));

const saveImages = (root, url, filesDirName, htmlPath) => {
  const { origin, hostname } = url;
  const imgData = [];

  return fsp.readFile(htmlPath, 'utf-8')
    .then((html) => {
      const $ = cheerio.load(html);

      $('img').each((_i, elem) => {
        const { src } = elem.attribs;
        const imgName = buildImgName(hostname, elem.attribs.src);
        const imgUrl = `${origin}${src}`;
        const output = path.join(root, filesDirName, imgName);
        const newSrc = path.join(filesDirName, imgName);

        // eslint-disable-next-line no-param-reassign
        elem.attribs.src = newSrc;

        if (src.startsWith('http')) {
          return;
        }

        imgData.push({ imgUrl, output });
      });

      const promises = imgData
        .map(({ imgUrl, output }) => fetchData(imgUrl, { responseType: 'stream' })
          .then((data) => saveFile(output, data)));

      return Promise.all(promises).then(() => Promise.resolve($.html()));
    })
    .then((html) => savePage(htmlPath, html));
};

export default (source, root) => {
  const url = new URL(source);
  const { hostname, pathname } = url;
  const htmlName = parseName(path.join(hostname, pathname)).concat('.html');
  const resourcesDirName = parseName(path.join(hostname, pathname)).concat('_files');
  const htmlPath = path.join(root, htmlName);

  return fetchData(url)
    .then((html) => savePage(htmlPath, html))
    .then(() => makeResourcesDir(root, resourcesDirName))
    .then(() => saveImages(root, url, resourcesDirName, htmlPath))
    .then(() => htmlPath);
};
