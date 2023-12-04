const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const localizedFormat = require('dayjs/plugin/localizedFormat');

// Load the necessary plugins for Day.js
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

// Set up a custom locale for Vietnamese
export const dayLocale = dayjs.locale({
  name: 'vi',
  months: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthsShort: [
    'Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6',
    'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'
  ]
});
