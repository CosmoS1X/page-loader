import path from 'path';
import os from 'os';
import fsp from 'fs/promises';
import nock from 'nock';
import app from '../src/index.js';

nock.disableNetConnect();

const url = 'https://ru.hexlet.io/courses';

describe('test page loader', () => {
  let tmpDir;
  let data;
  let fullpath;

  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    data = await fsp.readFile(path.join(process.cwd(), '__fixtures__', 'test-page.html'), 'utf-8');

    nock(/ru\.hexlet\.io/)
      .get(/\/courses/)
      .reply(200, data);

    fullpath = await app(url, tmpDir);
  });

  test('app', async () => {
    const expected = path.join(tmpDir, 'ru-hexlet-io-courses.html');
    expect(fullpath).toBe(expected);
  });
});
