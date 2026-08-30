import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';

import { RoutineScheduleField } from './routine-schedule-field';

afterEach(cleanup);

it('opens a weekly schedule dialog and reveals time controls for selected days', async () => {
  const user = userEvent.setup();
  render(<RoutineScheduleField />);

  await user.click(screen.getByRole('button', { name: 'Add schedule' }));

  expect(
    screen.getByRole('heading', { name: 'Schedule Routine' }),
  ).toBeVisible();
  expect(screen.getAllByRole('switch')).toHaveLength(7);
  expect(screen.queryByLabelText('Monday time')).toBeNull();

  await user.click(screen.getByRole('switch', { name: 'Schedule Monday' }));

  expect(screen.getByLabelText('Monday time')).toHaveValue('18:00');
  expect(screen.getByRole('button', { name: 'Save Schedule' })).toBeDisabled();
});
