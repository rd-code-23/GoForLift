import { describe, expect, it } from 'vitest';

import {
  INITIAL_SCHEDULE_EDITOR_STATE,
  scheduleEditorReducer,
} from './routine-schedule-editor.reducer';

describe('schedule editor reducer', () => {
  it('selects a day with the current shared time', () => {
    const mondaySelected = scheduleEditorReducer(
      INITIAL_SCHEDULE_EDITOR_STATE,
      { type: 'day-toggled', dayOfWeek: 1, isSelected: true },
    );
    const mondayTimeChanged = scheduleEditorReducer(mondaySelected, {
      type: 'time-changed',
      dayOfWeek: 1,
      time: '07:30',
    });
    const wednesdaySelected = scheduleEditorReducer(mondayTimeChanged, {
      type: 'day-toggled',
      dayOfWeek: 3,
      isSelected: true,
    });

    expect(wednesdaySelected.days[3]).toMatchObject({
      isSelected: true,
      time: '07:30',
    });
  });

  it('updates selected days together while shared time is enabled', () => {
    let state = scheduleEditorReducer(INITIAL_SCHEDULE_EDITOR_STATE, {
      type: 'day-toggled',
      dayOfWeek: 1,
      isSelected: true,
    });
    state = scheduleEditorReducer(state, {
      type: 'day-toggled',
      dayOfWeek: 3,
      isSelected: true,
    });
    state = scheduleEditorReducer(state, {
      type: 'time-changed',
      dayOfWeek: 1,
      time: '08:15',
    });

    expect(state.days[1]?.time).toBe('08:15');
    expect(state.days[3]?.time).toBe('08:15');
  });

  it('updates only one day after shared time is disabled', () => {
    let state = scheduleEditorReducer(INITIAL_SCHEDULE_EDITOR_STATE, {
      type: 'day-toggled',
      dayOfWeek: 1,
      isSelected: true,
    });
    state = scheduleEditorReducer(state, {
      type: 'day-toggled',
      dayOfWeek: 3,
      isSelected: true,
    });
    state = scheduleEditorReducer(state, {
      type: 'shared-time-toggled',
      isEnabled: false,
    });
    state = scheduleEditorReducer(state, {
      type: 'time-changed',
      dayOfWeek: 1,
      time: '09:00',
    });

    expect(state.days[1]?.time).toBe('09:00');
    expect(state.days[3]?.time).toBe('18:00');
  });
});
