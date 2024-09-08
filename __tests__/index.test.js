import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import nock from 'nock';
import os from 'os';
import app from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filename, encoding = 'utf-8') => fsp.readFile(getFixturePath(filename), encoding);

nock.disableNetConnect();

let tmpDir;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

it('should return the fullpath of the loaded page', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const html = await readFile('before.html');
  const img = await readFile('nodejs.png');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, html);

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, img);

  const expected = path.join(tmpDir, 'ru-hexlet-io-courses.html');
  const actual = await app(url, tmpDir);

  expect(actual).toBe(expected);
});

it('should save images', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const resourcesDir = path.join(tmpDir, 'ru-hexlet-io-courses_files');
  const imgName = 'ru-hexlet-io-assets-professions-nodejs.png';
  const imgFilePath = path.join(resourcesDir, imgName);
  const html = await readFile('before.html');
  const expected = await readFile('nodejs.png');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, html);

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, expected);

  await app(url, tmpDir);

  const actual = await fsp.readFile(imgFilePath, 'utf-8');

  expect(actual).toEqual(expected);
});

it('should change links in html file', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const html = await readFile('before.html');
  const htmlFilePath = path.join(tmpDir, 'ru-hexlet-io-courses.html');
  const img = await readFile('nodejs.png');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, html);

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, img);

  await app(url, tmpDir);

  const actual = await fsp.readFile(htmlFilePath, 'utf-8');
  const expected = await readFile('after.html');

  expect(actual).toBe(expected);
});

it('should throw an error if url is not valid', async () => {
  const url = 'http://invalid-url';

  nock(url)
    .get('/')
    .replyWithError('Invalid URL');

  await expect(app(url, tmpDir)).rejects.toThrow();
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true });
});
