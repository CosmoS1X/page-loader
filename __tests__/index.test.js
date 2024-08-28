import app from '../src/index.js';

test('Greeting', () => {
  const greeting = app();
  expect(greeting).toBe('Hello from new repository');
});
