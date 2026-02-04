import { test, expect } from "vitest";

import { formatCurrency } from '../formatCurrency';

// Adjust the expected string if your implementation formats differently.
test('formats number as Euro currency', () => {
  expect(formatCurrency(1234.5)).toBe('€1,234.50');
});

