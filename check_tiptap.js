const Table = require('@tiptap/extension-table');
const TableRow = require('@tiptap/extension-table-row');
const TableCell = require('@tiptap/extension-table-cell');
const TableHeader = require('@tiptap/extension-table-header');
const TaskList = require('@tiptap/extension-task-list');
const TaskItem = require('@tiptap/extension-task-item');
const Youtube = require('@tiptap/extension-youtube');
const TextAlign = require('@tiptap/extension-text-align');

console.log('Table exports:', Object.keys(Table));
console.log('TableRow exports:', Object.keys(TableRow));
console.log('TableCell exports:', Object.keys(TableCell));
console.log('TableHeader exports:', Object.keys(TableHeader));
console.log('TaskList exports:', Object.keys(TaskList));
console.log('TaskItem exports:', Object.keys(TaskItem));
console.log('Youtube exports:', Object.keys(Youtube));
console.log('TextAlign exports:', Object.keys(TextAlign));

console.log('Table default:', Table.default);
