import htmlParser from './htmlParser.js';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  saveFile,
  makeDir,
} from './utils.js';
import NetworkError from './errors/NetworkError.js';
import FileSystemError from './errors/FileSystemError.js';

const getResourcesMeta = (html, baseUrl, resourcesDirPath) => {
  const instance = htmlParser(html);
  const resourcesMeta = instance.processResources(baseUrl, resourcesDirPath);

  return { html: instance.getHTML(), resourcesMeta };
};

const fetchResources = ((resourcesMeta) => {
  const promises = resourcesMeta.map(({ type, url, outputPath }) => {
    const fetchOptions = (type === 'img') ? { responseType: 'stream' } : {};

    return fetchData(url, fetchOptions).then((data) => ({ outputPath, data }));
  });

  return Promise.all(promises);
});

const saveResources = (resourcesData) => {
  const promises = resourcesData.map(({ outputPath, data }) => saveFile(outputPath, data));

  return Promise.all(promises);
};

const savePage = (htmlPath, { html, resourcesMeta }) => prettifyHTML(html)
  .then((data) => saveFile(htmlPath, data))
  .then(() => resourcesMeta);

const makePageDirs = (...paths) => Promise.all(paths.map((path) => makeDir(path)));

const errorHandler = (error) => {
  console.error(error.message);

  if (error instanceof NetworkError) {
    return process.exit(1);
  }

  if (error instanceof FileSystemError) {
    return process.exit(2);
  }

  throw error;
};

export default (pageUrl, root) => {
  const { origin: baseUrl, hostname, pathname } = new URL(pageUrl);
  const baseName = sanitizeFileName(buildPath(hostname, pathname));
  const htmlName = baseName.concat('.html');
  const resourcesDirName = baseName.concat('_files');
  const resourcesDirPath = buildPath(root, resourcesDirName);
  const htmlPath = buildPath(root, htmlName);

  return makePageDirs(root, resourcesDirPath)
    .then(() => fetchData(pageUrl))
    .then((html) => getResourcesMeta(html, baseUrl, resourcesDirPath))
    .then((data) => savePage(htmlPath, data))
    .then((resourcesMeta) => fetchResources(resourcesMeta))
    .then((resourcesData) => saveResources(resourcesData))
    .then(() => {
      console.log(`Page was successfully downloaded into ${htmlPath}`);
      return htmlPath;
    })
    .catch((error) => errorHandler(error));
};
