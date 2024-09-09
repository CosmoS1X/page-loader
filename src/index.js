import htmlParser from './htmlParser.js';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  saveFile,
  makeDir,
} from './utils.js';

const getResourcesInfo = (html, baseUrl, resourcesDirPath, resourcesDirName) => {
  const instance = htmlParser(html);
  const resourcesInfo = instance.processResources(baseUrl, resourcesDirPath, resourcesDirName);

  return { html: instance.getHTML(), resourcesInfo };
};

const fetchResources = (({ html, resourcesInfo }) => {
  const promises = resourcesInfo.map(({ type, url, outputPath }) => {
    const fetchOptions = (type === 'img') ? { responseType: 'stream' } : {};

    return fetchData(url, fetchOptions).then((data) => ({ outputPath, data }));
  });

  return Promise.all(promises).then((resourcesData) => ({ html, resourcesData }));
});

const saveResources = ({ html, resourcesData }) => {
  const promises = resourcesData.map(({ outputPath, data }) => saveFile(outputPath, data));

  return Promise.all(promises).then(() => html);
};

const savePage = (htmlPath, html) => prettifyHTML(html)
  .then((data) => saveFile(htmlPath, data));

export default (source, root) => {
  const {
    href, origin: baseUrl, hostname, pathname,
  } = new URL(source);
  const baseName = sanitizeFileName(buildPath(hostname, pathname));
  const htmlName = baseName.concat('.html');
  const resourcesDirName = baseName.concat('_files');
  const resourcesDirPath = buildPath(root, resourcesDirName);
  const htmlPath = buildPath(root, htmlName);

  return makeDir(root)
    .then(makeDir(resourcesDirPath))
    .then(() => fetchData(href))
    .then((html) => getResourcesInfo(html, baseUrl, resourcesDirPath, resourcesDirName))
    .then((data) => fetchResources(data))
    .then((data) => saveResources(data))
    .then((data) => savePage(htmlPath, data))
    .then(() => {
      console.log(`Page was successfully downloaded into ${htmlPath}`);
      return htmlPath;
    });
};
