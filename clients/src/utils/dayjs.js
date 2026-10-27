import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Import dayjs from here, never from 'dayjs' directly. Metro's inline
// requires load a module only when it is first used, so plugins registered in
// some other file (timeUtils) may not be there yet: `utcOffset(420)` without
// the utc plugin returns a number and the next `.format()` crashes.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export default dayjs;
