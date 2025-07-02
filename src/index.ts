import fsp from 'fs/promises';
import Listr from 'listr';
import htmlParser from './htmlParser';
import {
  fetchData,
  buildPath,
  prettifyHTML,
  sanitizeFileName,
  saveFile,
} from './utils';

const getMeta = (html: string, baseUrl: string, resourcesDirPath: string) => {
  const instance = htmlParser(html);
  const resourcesMeta = instance.processResources(baseUrl, resourcesDirPath);

  return { html: instance.getHTML(), resources: resourcesMeta };
};

const downloadResources = (html: string, baseUrl: string, resourcesDirPath: string) => {
  const meta = getMeta(html, baseUrl, resourcesDirPath);
  const tasks = new Listr(meta.resources.map(({ url, outputPath }) => (
    {
      title: url,
      task: () => fetchData(url).then((data) => saveFile(outputPath, data)),
    }
  )), { concurrent: true });

  return fsp.mkdir(resourcesDirPath).then(() => tasks.run()).then(() => meta.html);
};

const savePage = (htmlPath: string, html: string) => prettifyHTML(html)
  .then((data) => saveFile(htmlPath, data));

export default (pageUrl: string, outputDir = process.cwd()) => {
  const { origin: baseUrl, hostname, pathname } = new URL(pageUrl);
  const baseName = sanitizeFileName(buildPath(hostname, pathname));
  const htmlName = baseName.concat('.html');
  const resourcesDirName = baseName.concat('_files');
  const resourcesDirPath = buildPath(outputDir, resourcesDirName);
  const htmlPath = buildPath(outputDir, htmlName);

  return fsp.access(outputDir)
    .then(() => fetchData(pageUrl))
    .then((html) => downloadResources(html, baseUrl, resourcesDirPath))
    .then((html) => savePage(htmlPath, html))
    .then(() => htmlPath);
};
