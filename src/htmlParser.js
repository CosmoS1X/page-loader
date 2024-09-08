import * as cheerio from 'cheerio';
import {
  fetchData, buildFileName, buildPath, saveFile,
} from './utils.js';

export default (html) => {
  const tagMap = {
    img: 'src',
    link: 'href',
    script: 'src',
  };
  const $ = cheerio.load(html);

  return {
    processSource: (tagName, paths, resourcesDirName) => {
      const { fs: { resourcesDirPath }, url: { origin } } = paths;
      const resourcePaths = [];

      $(tagName).each(function () {
        const src = $(this).attr(tagMap[tagName]);
        const { href, hostname, pathname } = new URL(src, origin);
        if (href.startsWith(origin)) {
          const fileName = buildFileName(hostname, pathname);
          const filePath = buildPath(resourcesDirName, fileName);
          const outputPath = buildPath(resourcesDirPath, fileName);
          $(this).attr(tagMap[tagName], filePath);
          resourcePaths.push({ url: href, outputPath });
        }
      });

      const fetchOptions = tagName === 'img' ? { responseType: 'stream' } : {};

      return resourcePaths.map(({ url, outputPath }) => fetchData(url, fetchOptions)
        .then((data) => saveFile(outputPath, data)));
    },
    getHTML: () => $.html(),
  };
};
