import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';

import { RoutineDraftFormProvider } from '../routine-draft-form';
import { RoutineScheduleField } from './routine-schedule-field';

afterEach(cleanup);

it('opens a weekly schedule dialog and reveals time controls for selected days', async () => {
  const user = userEvent.setup();
  renderScheduleField();

  await user.click(screen.getByRole('button', { name: 'Add schedule' }));

  expect(
    screen.getByRole('heading', { name: 'Schedule Routine' }),
  ).toBeVisible();
  expect(screen.getAllByRole('switch', { name: /^Schedule / })).toHaveLength(7);
  expect(screen.queryByLabelText('Monday time')).toBeNull();

  await user.click(screen.getByRole('switch', { name: 'Schedule Monday' }));

  expect(screen.getByLabelText('Monday time')).toHaveValue('18:00');
  expect(screen.getByRole('button', { name: 'Save Schedule' })).toBeEnabled();
});

it('keeps selected days synchronized until shared time is disabled', async () => {
  const user = userEvent.setup();
  renderScheduleField();

  await user.click(screen.getByRole('button', { name: 'Add schedule' }));
  await user.click(screen.getByRole('switch', { name: 'Schedule Monday' }));
  await user.click(screen.getByRole('switch', { name: 'Schedule Wednesday' }));

  fireEvent.change(screen.getByLabelText('Monday time'), {
    target: { value: '07:30' },
  });

  expect(screen.getByLabelText('Monday time')).toHaveValue('07:30');
  expect(screen.getByLabelText('Wednesday time')).toHaveValue('07:30');

  await user.click(
    screen.getByRole('switch', {
      name: 'Use same time for selected days',
    }),
  );
  fireEvent.change(screen.getByLabelText('Monday time'), {
    target: { value: '08:15' },
  });

  expect(screen.getByLabelText('Monday time')).toHaveValue('08:15');
  expect(screen.getByLabelText('Wednesday time')).toHaveValue('07:30');
});

it('saves selected schedules into the routine draft', async () => {
  const user = userEvent.setup();
  renderScheduleField();

  await user.click(screen.getByRole('button', { name: 'Add schedule' }));
  await user.click(screen.getByRole('switch', { name: 'Schedule Monday' }));
  fireEvent.change(screen.getByLabelText('Monday time'), {
    target: { value: '07:30' },
  });
  await user.click(screen.getByRole('button', { name: 'Save Schedule' }));

  expect(
    screen.queryByRole('heading', { name: 'Schedule Routine' }),
  ).toBeNull();
  expect(screen.getByText('Mon')).toBeVisible();
  expect(screen.getByText('7:30 AM')).toBeVisible();
});

it('discards unsaved schedule changes when cancelled', async () => {
  const user = userEvent.setup();
  renderScheduleField();

  await user.click(screen.getByRole('button', { name: 'Add schedule' }));
  await user.click(screen.getByRole('switch', { name: 'Schedule Tuesday' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await user.click(screen.getByRole('button', { name: 'Add schedule' }));

  expect(
    screen.getByRole('switch', { name: 'Schedule Tuesday' }),
  ).not.toBeChecked();
  expect(screen.queryByLabelText('Tuesday time')).toBeNull();
});

function renderScheduleField() {
  render(
    <RoutineDraftFormProvider>
      <RoutineScheduleField />
    </RoutineDraftFormProvider>,
  );
}
