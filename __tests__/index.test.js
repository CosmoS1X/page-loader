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
const { origin, pathname } = url;
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

  nock(origin)
    .get(pathname)
    .reply(200, html);

  const expected = buildPath(tmpDir, htmlFileName);
  const actual = await app(url, tmpDir);

  expect(actual).toBe(expected);
});

it('should throw an error if url is not valid', async () => {
  const invalidUrl = 'http://invalid-url';

  nock(invalidUrl)
    .get('/')
    .replyWithError('Invalid URL');

  await expect(app(url, tmpDir)).rejects.toThrow();
});

it('should save images and change links in html to local', async () => {
  const resourcesDir = buildPath(tmpDir, resourcesDirName);
  const templateHTML = await readFile(getFixturePath('page-with-img-before.html'));
  const expectedHTML = await readFile(getFixturePath('page-with-img-after.html'));
  const expectedImg = await readFile(getFixturePath('nodejs.png'), '');

  nock(origin)
    .get(pathname)
    .reply(200, templateHTML);

  nock(origin)
    .get('/assets/professions/nodejs.png')
    .reply(200, expectedImg);

  await app(url, tmpDir);

  const actualImg = await readFile(buildPath(resourcesDir, imgFileName), '');
  const actualHTML = await readFile(buildPath(tmpDir, htmlFileName));

  expect(actualImg).toEqual(expectedImg);
  expect(actualHTML).toBe(expectedHTML);
});

it('should save all resources and change links in html to local', async () => {
  const resourcesDir = buildPath(tmpDir, resourcesDirName);
  const templateHTML = await readFile(getFixturePath('page-with-resources-before.html'));
  const expectedHTML = await readFile(getFixturePath('page-with-resources-after.html'));
  const expectedImg = await readFile(getFixturePath('nodejs.png'), '');
  const expectedJS = await readFile(getFixturePath('runtime.js'));
  const expectedCSS = await readFile(getFixturePath('application.css'));

  nock(origin)
    .get(pathname)
    .reply(200, templateHTML);

  nock(origin)
    .get('/assets/professions/nodejs.png')
    .reply(200, expectedImg);

  nock(origin)
    .get('/packs/js/runtime.js')
    .reply(200, expectedJS);

  nock(origin)
    .get('/assets/application.css')
    .reply(200, expectedCSS);

  nock(origin)
    .get(pathname)
    .reply(200, templateHTML);

  await app(url, tmpDir);

  const actualJS = await readFile(buildPath(resourcesDir, jsFileName));
  const actualCSS = await readFile(buildPath(resourcesDir, cssFileName));
  const canonicalHTML = await readFile(buildPath(resourcesDir, htmlFileName));
  const actualHTML = await readFile(buildPath(tmpDir, htmlFileName));

  expect(actualJS).toBe(expectedJS);
  expect(actualCSS).toBe(expectedCSS);
  expect(canonicalHTML).toBe(templateHTML);
  expect(actualHTML).toEqual(expectedHTML);
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true });
});
