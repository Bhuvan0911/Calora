import { query } from 'express-validator';
import { paginationValidators } from '../lib/pagination.js';

const rangeValidators = [
  query('from').optional().isISO8601().withMessage('from must be an ISO date.').toDate(),
  query('to').optional().isISO8601().withMessage('to must be an ISO date.').toDate(),
];

export const reportRangeValidators = [...rangeValidators, ...paginationValidators];

export const snapshotValidators = [
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be a calendar date in YYYY-MM-DD form.')
    .isISO8601({ strict: true })
    .withMessage('date must be a real calendar date.'),
];
