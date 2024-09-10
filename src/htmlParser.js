import * as cheerio from 'cheerio';
import { buildFileName, buildPath } from './utils.js';

const tagAttributeMap = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const processTag = ($, tagName, baseUrl, resourcesDirPath, resourcesDirName) => {
  const resourcesMeta = [];

  $(tagName).each(function () {
    const src = $(this).attr(tagAttributeMap[tagName]);
    const { href, hostname, pathname } = new URL(src, baseUrl);

    if (!src || !href.startsWith(baseUrl)) return;

    const fileName = buildFileName(hostname, pathname);
    const filePath = buildPath(resourcesDirName, fileName);
    const outputPath = buildPath(resourcesDirPath, fileName);

    $(this).attr(tagAttributeMap[tagName], filePath);

    resourcesMeta.push({ type: tagName, url: href, outputPath });
  });

  return resourcesMeta;
};

export default (html) => {
  const $ = cheerio.load(html);

  return {
    processResources: (baseUrl, resourcesDirPath, resourcesDirName) => {
      const resourceTags = ['img', 'link', 'script'];

      return resourceTags
        .flatMap((tagName) => processTag($, tagName, baseUrl, resourcesDirPath, resourcesDirName));
    },
    getHTML: () => $.html(),
  };
};
