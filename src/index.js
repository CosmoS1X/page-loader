import Listr from 'listr';
import htmlParser from './htmlParser.js';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  saveFile,
  makeDir,
} from './utils.js';

const getResourcesMeta = (html, baseUrl, resourcesDirPath) => {
  const instance = htmlParser(html);
  const resourcesMeta = instance.processResources(baseUrl, resourcesDirPath);

  return { html: instance.getHTML(), resourcesMeta };
};

const downloadResources = (resourcesMeta) => {
  const tasks = new Listr(resourcesMeta.map(({ type, url, outputPath }) => {
    const fetchOptions = (type === 'img') ? { responseType: 'stream' } : {};

    return {
      title: url,
      task: () => fetchData(url, fetchOptions).then((data) => saveFile(outputPath, data)),
    };
  }), { concurrent: true });

  return tasks.run();
};

const savePage = (htmlPath, { html, resourcesMeta }) => prettifyHTML(html)
  .then((data) => saveFile(htmlPath, data))
  .then(() => resourcesMeta);

const makePageDirs = (...paths) => Promise.all(paths.map((path) => makeDir(path)));

const errorHandler = (error) => {
  console.error(error.message);

  switch (error.name) {
    case 'NetworkError':
      return process.exit(1);
    case 'FileSystemError':
      return process.exit(2);
    default:
      /* c8 ignore next */
      throw error;
  }
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
    .then((resourcesMeta) => downloadResources(resourcesMeta))
    .then(() => {
      console.log(`Page was successfully downloaded into ${htmlPath}`);
      return htmlPath;
    })
    .catch((error) => errorHandler(error));
};
