import path from 'path';
import os from 'os';
import fsp from 'fs/promises';
import nock from 'nock';
import app from '../src/index.js';

nock.disableNetConnect();

let tmpDir;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

it('should return the fullpath to the downloaded file', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const data = await fsp.readFile(path.join(process.cwd(), '__fixtures__', 'test-page.html'), 'utf-8');
  const expected = path.join(tmpDir, 'ru-hexlet-io-courses.html');

  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);

  await expect(app(url, tmpDir)).resolves.toBe(expected);
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
