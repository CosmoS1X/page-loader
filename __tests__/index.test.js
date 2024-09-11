import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import nock from 'nock';
import os from 'os';
import app from '../src/index.js';
import { buildPath, readFile } from '../src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

nock.disableNetConnect();

let tmpDir;
const url = new URL('https://ru.hexlet.io/courses');
const baseUrl = url.origin;
const htmlFileName = 'ru-hexlet-io-courses.html';
const resourcesDirName = 'ru-hexlet-io-courses_files';
const imgFileName = 'ru-hexlet-io-assets-professions-nodejs.png';
const jsFileName = 'ru-hexlet-io-packs-js-runtime.js';
const cssFileName = 'ru-hexlet-io-assets-application.css';

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

it('should throw an error if the request fails', async () => {
  nock(baseUrl)
    .get('/courses')
    .replyWithError('Something went wrong');

  await expect(app(url, tmpDir)).rejects.toThrow();
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

  expect(actualImg).toEqual(expectedImg);
  expect(actualHTML).toBe(expectedHTML);
});

it('should save all resources and update HTML links to local paths', async () => {
  const resourcesDir = buildPath(tmpDir, resourcesDirName);
  const initialHTML = await readFile(getFixturePath('page-with-resources-before.html'));
  const updatedHTML = await readFile(getFixturePath('page-with-resources-after.html'));
  const expectedImg = await readFile(getFixturePath('nodejs.png'), { encoding: null });
  const expectedJS = await readFile(getFixturePath('runtime.js'));
  const expectedCSS = await readFile(getFixturePath('application.css'));

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

  await app(url, tmpDir);

  const actualJS = await readFile(buildPath(resourcesDir, jsFileName));
  const actualCSS = await readFile(buildPath(resourcesDir, cssFileName));
  const actualUpdatedHtml = await readFile(buildPath(tmpDir, htmlFileName));

  expect(actualJS).toBe(expectedJS);
  expect(actualCSS).toBe(expectedCSS);
  expect(actualUpdatedHtml).toEqual(updatedHTML);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true });
});
