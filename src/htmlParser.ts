import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import path from 'path';
import type { Element } from 'domhandler';
import { buildFileName, buildPath } from './utils';

type TagNamesUnion = 'img' | 'link' | 'script';
type TagAttributesUnion = 'src' | 'href';
type TagAttributeMap = Record<TagNamesUnion, TagAttributesUnion>;

type HandleAttributes = (
  el: Element,
  tagName: TagNamesUnion,
  baseUrl: string,
  resourcesDirPath: string) => { url: string, outputPath: string };

type ProcessTags = (
  $: CheerioAPI,
  tagName: TagNamesUnion,
  baseUrl: string,
  resourcesDirPath: string) => { url: string, outputPath: string }[];

const tagAttributeMap: TagAttributeMap = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const handleAttributes: HandleAttributes = (el, tagName, baseUrl, resourcesDirPath) => {
  const resourcesDirName = path.basename(resourcesDirPath);
  const { attribs } = el;
  const src = attribs[tagAttributeMap[tagName]];
  const { href: url, hostname, pathname } = new URL(src, baseUrl);
  const fileName = buildFileName(hostname, pathname);
  const filePath = buildPath(resourcesDirName, fileName);
  const outputPath = buildPath(resourcesDirPath, fileName);

  attribs[tagAttributeMap[tagName]] = filePath;

  return { url, outputPath };
};

const processTag: ProcessTags = ($, tagName, baseUrl, resourcesDirPath) => Array.from($(tagName))
  .filter((el) => {
    const src = el.attribs[tagAttributeMap[tagName]];
    const { href: url } = new URL(src, baseUrl);

    return src && url.startsWith(baseUrl);
  })
  .map((el) => handleAttributes(el, tagName, baseUrl, resourcesDirPath));

export default (html: string) => {
  const $ = cheerio.load(html);

  return {
    processResources: (baseUrl: string, resourcesDirPath: string) => {
      const resourceTags: TagNamesUnion[] = ['img', 'link', 'script'];

      return resourceTags.flatMap((tagName) => processTag($, tagName, baseUrl, resourcesDirPath));
    },
    getHTML: () => $.html(),
  };
};
