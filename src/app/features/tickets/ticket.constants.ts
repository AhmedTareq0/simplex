/**
 * Re-exports from the centralized core constants.
 * Kept for backward compatibility — prefer importing from '@/core/constants/status.constants' directly.
 */
export { TICKET_STATUS, PRIORITY } from '../../core/constants/status.constants';
export { formatDateShort, formatDateLong } from '../../core/utils/date.util';
// Convenience aliases matching old API
import { TICKET_STATUS, PRIORITY } from '../../core/constants/status.constants';

export const TICKET_STATUS_OPTIONS = TICKET_STATUS.options;
export const TICKET_PRIORITY_OPTIONS = PRIORITY.options;
export const getStatusLabel = TICKET_STATUS.getLabel;
export const getStatusColor = TICKET_STATUS.getColor;
export const getPriorityLabel = PRIORITY.getLabel;
export const getPriorityColor = PRIORITY.getColor;
export const isActiveTicketStatus = TICKET_STATUS.isActive;
