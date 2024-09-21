import { beforeEach, it, expect } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import nock from 'nock';
import os from 'os';
import app from '../src/index.js';
import { buildPath, makeDir, saveFile } from '../src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filepath, options = { encoding: 'utf-8' }) => fsp.readFile(filepath, options);

nock.disableNetConnect();

let tmpDir;
const { href: url, origin: baseUrl } = new URL('https://ru.hexlet.io/courses');
const htmlFileName = 'ru-hexlet-io-courses.html';
const resourcesDirName = 'ru-hexlet-io-courses_files';
const imgFileName = 'ru-hexlet-io-assets-professions-nodejs.png';
const jsFileName = 'ru-hexlet-io-packs-js-runtime.js';
const cssFileName = 'ru-hexlet-io-assets-application.css';
const jsonFileName = 'ru-hexlet-io-manifest.json';

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

it('should return the fullpath of the loaded page', async () => {
  const html = await readFile(getFixturePath('page-without-resources.html'));

  nock(baseUrl)
    .get('/courses')
    .reply(200, html);

  const expected = buildPath(tmpDir, htmlFileName);
  const actual = await app(url, tmpDir);

  expect(actual).toBe(expected);
});

it('should save images and update HTML links to local paths', async () => {
  const resourcesDir = buildPath(tmpDir, resourcesDirName);
  const templateHTML = await readFile(getFixturePath('page-with-img-before.html'));
  const expectedHTML = await readFile(getFixturePath('page-with-img-after.html'));
  const expectedImg = await readFile(getFixturePath('nodejs.png'), { encoding: null });

  nock(baseUrl)
    .get('/courses')
    .reply(200, templateHTML);

  nock(baseUrl)
    .get('/assets/professions/nodejs.png')
    .reply(200, expectedImg);

  await app(url, tmpDir);

  const actualImg = await readFile(buildPath(resourcesDir, imgFileName), { encoding: null });
  const actualHTML = await readFile(buildPath(tmpDir, htmlFileName));

  expect(actualImg).toStrictEqual(expectedImg);
  expect(actualHTML).toStrictEqual(expectedHTML);
});

it('should save all resources and update HTML links to local paths', async () => {
  const resourcesDir = buildPath(tmpDir, resourcesDirName);
  const initialHTML = await readFile(getFixturePath('page-with-resources-before.html'));
  const updatedHTML = await readFile(getFixturePath('page-with-resources-after.html'));
  const expectedImg = await readFile(getFixturePath('nodejs.png'), { encoding: null });
  const expectedJS = await readFile(getFixturePath('runtime.js'));
  const expectedCSS = await readFile(getFixturePath('application.css'));
  const expectedJSON = await readFile(getFixturePath('manifest.json'));

  nock(baseUrl)
    .get('/courses')
    .times(2)
    .reply(200, initialHTML);

  nock(baseUrl)
    .get('/assets/professions/nodejs.png')
    .reply(200, expectedImg);

  nock(baseUrl)
    .get('/packs/js/runtime.js')
    .reply(200, expectedJS);

  nock(baseUrl)
    .get('/assets/application.css')
    .reply(200, expectedCSS);

  nock(baseUrl)
    .get('/manifest.json')
    .reply(200, expectedJSON);

  await app(url, tmpDir);

  const actualJS = await readFile(buildPath(resourcesDir, jsFileName));
  const actualCSS = await readFile(buildPath(resourcesDir, cssFileName));
  const actualJSON = await readFile(buildPath(resourcesDir, jsonFileName));
  const actualUpdatedHtml = await readFile(buildPath(tmpDir, htmlFileName));

  expect(actualJS).toStrictEqual(expectedJS);
  expect(actualCSS).toStrictEqual(expectedCSS);
  expect(actualJSON).toStrictEqual(expectedJSON);
  expect(actualUpdatedHtml).toStrictEqual(updatedHTML);
});

it('should throw an error if the request fails', async () => {
  nock(baseUrl)
    .get('/courses')
    .reply(404);

  await expect(app(url, tmpDir)).rejects.toThrow();
});

it('should throw an error if the path does not exist', async () => {
  const notExistsPath = '/tmp/unknown';

  await expect(app(url, notExistsPath)).rejects.toThrow();
});

it('should throw an error if the app cannot create a dir', async () => {
  await expect(makeDir('/bin/page-loader')).rejects.toThrow();
});

it('should throw an error if the app cannot save a file', async () => {
  await expect(saveFile('/tmp/page-loader/', 'data')).rejects.toThrow();
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true });
});
