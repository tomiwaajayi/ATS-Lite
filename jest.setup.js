import '@testing-library/jest-dom';

// Mock fetch for Jest environment
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  })
);
