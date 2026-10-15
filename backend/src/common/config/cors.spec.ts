import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it.each([undefined, '', '  ', ' , '])('falls back to the local web app for %p', (raw) => {
    expect(parseCorsOrigins(raw)).toEqual(['http://localhost:3001']);
  });

  it('splits a comma-separated list and trims whitespace', () => {
    expect(parseCorsOrigins(' https://orbit.app , https://www.orbit.app')).toEqual([
      'https://orbit.app',
      'https://www.orbit.app',
    ]);
  });

  it('drops empty entries', () => {
    expect(parseCorsOrigins('https://orbit.app,,')).toEqual(['https://orbit.app']);
  });
});
