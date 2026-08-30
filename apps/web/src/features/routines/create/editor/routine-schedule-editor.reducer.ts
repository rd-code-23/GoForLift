import type { CreateRoutineInput } from '@goforlift/contracts';

export const DEFAULT_SCHEDULE_TIME = '18:00';

type RoutineSchedule = CreateRoutineInput['schedules'][number];

export type ScheduleEditorDay = {
  dayOfWeek: number;
  isSelected: boolean;
  time: string;
};

export type ScheduleEditorState = {
  days: ScheduleEditorDay[];
  useSameTime: boolean;
};

export type ScheduleEditorAction =
  | { type: 'draft-loaded'; schedules: RoutineSchedule[] }
  | { type: 'day-toggled'; dayOfWeek: number; isSelected: boolean }
  | { type: 'time-changed'; dayOfWeek: number; time: string }
  | { type: 'shared-time-toggled'; isEnabled: boolean };

export const INITIAL_SCHEDULE_EDITOR_STATE = createScheduleEditorState([]);

export function scheduleEditorReducer(
  state: ScheduleEditorState,
  action: ScheduleEditorAction,
): ScheduleEditorState {
  switch (action.type) {
    case 'draft-loaded':
      return createScheduleEditorState(action.schedules);

    case 'day-toggled':
      return {
        ...state,
        days: toggleDay(state.days, action, state.useSameTime),
      };

    case 'time-changed':
      return {
        ...state,
        days: changeDayTime(state.days, action, state.useSameTime),
      };

    case 'shared-time-toggled':
      return {
        ...state,
        useSameTime: action.isEnabled,
        days: action.isEnabled
          ? synchronizeSelectedDayTimes(state.days)
          : state.days,
      };
  }
}

export function createScheduleEditorState(
  schedules: RoutineSchedule[],
): ScheduleEditorState {
  return {
    days: Array.from({ length: 7 }, (_, dayOfWeek) => {
      const savedSchedule = schedules.find(
        (schedule) => schedule.dayOfWeek === dayOfWeek,
      );

      return {
        dayOfWeek,
        isSelected: Boolean(savedSchedule),
        time: savedSchedule?.localTime.slice(0, 5) ?? DEFAULT_SCHEDULE_TIME,
      };
    }),
    useSameTime: hasOneSelectedTime(schedules),
  };
}

function hasOneSelectedTime(schedules: RoutineSchedule[]) {
  return new Set(schedules.map((schedule) => schedule.localTime)).size <= 1;
}

function toggleDay(
  days: ScheduleEditorDay[],
  action: Extract<ScheduleEditorAction, { type: 'day-toggled' }>,
  useSameTime: boolean,
) {
  const sharedTime = getFirstSelectedTime(days);

  return days.map((day) =>
    day.dayOfWeek === action.dayOfWeek
      ? {
          ...day,
          isSelected: action.isSelected,
          time: action.isSelected && useSameTime ? sharedTime : day.time,
        }
      : day,
  );
}

function changeDayTime(
  days: ScheduleEditorDay[],
  action: Extract<ScheduleEditorAction, { type: 'time-changed' }>,
  useSameTime: boolean,
) {
  return days.map((day) => {
    const shouldChange = useSameTime
      ? day.isSelected
      : day.dayOfWeek === action.dayOfWeek;

    return shouldChange ? { ...day, time: action.time } : day;
  });
}

function synchronizeSelectedDayTimes(days: ScheduleEditorDay[]) {
  const sharedTime = getFirstSelectedTime(days);

  return days.map((day) =>
    day.isSelected ? { ...day, time: sharedTime } : day,
  );
}

function getFirstSelectedTime(days: ScheduleEditorDay[]) {
  return days.find((day) => day.isSelected)?.time ?? DEFAULT_SCHEDULE_TIME;
}
