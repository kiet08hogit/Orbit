module.exports = {
  v4: jest.fn(() => 'mocked-uuid'),
  v1: jest.fn(() => 'mocked-uuid'),
  NIL: '00000000-0000-0000-0000-000000000000',
  version: jest.fn(),
  validate: jest.fn(),
  stringify: jest.fn(),
  parse: jest.fn(),
};
