import * as cheerio from 'cheerio';
import path from 'path';
import { buildFileName, buildPath } from './utils.js';

const tagAttributeMap = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const processTag = ($, tagName, baseUrl, resourcesDirPath) => {
  const resourcesDirName = path.basename(resourcesDirPath);

  return Array.from($(tagName))
    .filter((el) => {
      const src = el.attribs[tagAttributeMap[tagName]];
      const { href: url } = new URL(src, baseUrl);

      return src && url.startsWith(baseUrl);
    })
    .map((el) => {
      const { attribs } = el;
      const src = attribs[tagAttributeMap[tagName]];
      const { href: url, hostname, pathname } = new URL(src, baseUrl);
      const fileName = buildFileName(hostname, pathname);
      const filePath = buildPath(resourcesDirName, fileName);
      const outputPath = buildPath(resourcesDirPath, fileName);

      attribs[tagAttributeMap[tagName]] = filePath;

      return { url, outputPath };
    });
};

export default (html) => {
  const $ = cheerio.load(html);

  return {
    processResources: (baseUrl, resourcesDirPath) => {
      const resourceTags = ['img', 'link', 'script'];

      return resourceTags
        .flatMap((tagName) => processTag($, tagName, baseUrl, resourcesDirPath));
    },
    getHTML: () => $.html(),
  };
};
