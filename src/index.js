import fsp from 'fs/promises';
import * as cheerio from 'cheerio';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  buildFileName,
  readFile,
  saveFile,
} from './utils.js';

const savePage = (output, html) => prettifyHTML(html)
  .then((data) => saveFile(output, data));

const makeResourcesDir = (root, dirname) => fsp.mkdir(buildPath(root, dirname));

const saveImages = (root, url, resourcesDirName, htmlPath) => {
  const { origin, hostname } = url;
  const imgData = [];

  return readFile(htmlPath)
    .then((html) => {
      const $ = cheerio.load(html);

      $('img').each(function () {
        const src = $(this).attr('src');
        const imgUrl = new URL(src, origin);
        const imgName = buildFileName(hostname, src);
        const outputPath = buildPath(root, resourcesDirName, imgName);

        $(this).attr('src', buildPath(resourcesDirName, imgName));

        imgData.push({ imgUrl, outputPath });
      });

      const promises = imgData
        .map(({ imgUrl, outputPath }) => fetchData(imgUrl, { responseType: 'stream' })
          .then((data) => saveFile(outputPath, data)));

      return Promise.all(promises).then(() => Promise.resolve($.html()));
    })
    .then((html) => savePage(htmlPath, html));
};

export default (source, root) => {
  const url = new URL(source);
  const { hostname, pathname } = url;
  const baseName = sanitizeFileName(buildPath(hostname, pathname));
  const htmlName = baseName.concat('.html');
  const resourcesDirName = baseName.concat('_files');
  const htmlPath = buildPath(root, htmlName);

  return fetchData(url)
    .then((html) => savePage(htmlPath, html))
    .then(() => makeResourcesDir(root, resourcesDirName))
    .then(() => saveImages(root, url, resourcesDirName, htmlPath))
    .then(() => htmlPath);
};
