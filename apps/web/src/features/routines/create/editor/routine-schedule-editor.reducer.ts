export const DEFAULT_SCHEDULE_TIME = '18:00';

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
  | { type: 'day-toggled'; dayOfWeek: number; isSelected: boolean }
  | { type: 'time-changed'; dayOfWeek: number; time: string }
  | { type: 'shared-time-toggled'; isEnabled: boolean };

export const INITIAL_SCHEDULE_EDITOR_STATE: ScheduleEditorState = {
  days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isSelected: false,
    time: DEFAULT_SCHEDULE_TIME,
  })),
  useSameTime: true,
};

export function scheduleEditorReducer(
  state: ScheduleEditorState,
  action: ScheduleEditorAction,
): ScheduleEditorState {
  switch (action.type) {
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
