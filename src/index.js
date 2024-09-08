import fsp from 'fs/promises';
import htmlParser from './htmlParser.js';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  readFile,
  saveFile,
} from './utils.js';

const makeRootDir = (root) => fsp.mkdir(root, { recursive: true });

const savePage = (filepath, html) => prettifyHTML(html)
  .then((data) => saveFile(filepath, data));

const makeResourcesDir = ({ fs: { resourcesDirPath } }) => (
  fsp.mkdir(resourcesDirPath, { recursive: true })
);

const saveResources = (paths, resourcesDirName) => {
  const { fs: { htmlPath } } = paths;
  const resourceTags = ['img', 'link', 'script'];

  return readFile(htmlPath)
    .then((html) => {
      const instance = htmlParser(html);

      const promises = resourceTags
        .flatMap((tagName) => instance.processSource(tagName, paths, resourcesDirName));

      return Promise.all(promises)
        .then(() => Promise.resolve(instance.getHTML()));
    })
    .then((html) => savePage(htmlPath, html));
};

export default (source, root) => {
  const {
    href, origin, hostname, pathname,
  } = new URL(source);
  const baseName = sanitizeFileName(buildPath(hostname, pathname));
  const htmlName = baseName.concat('.html');
  const resourcesDirName = baseName.concat('_files');
  const resourcesDirPath = buildPath(root, resourcesDirName);
  const htmlPath = buildPath(root, htmlName);
  const paths = {
    fs: {
      root,
      resourcesDirPath,
      htmlPath,
    },
    url: {
      href,
      origin,
      hostname,
      pathname,
    },
  };

  return makeRootDir(root)
    .then(() => fetchData(href))
    .then((html) => savePage(htmlPath, html))
    .then(() => makeResourcesDir(paths))
    .then(() => saveResources(paths, resourcesDirName))
    .then(() => htmlPath);
};
