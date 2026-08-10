/**
 * Page size of the admin reports grid. Lives outside the grid component so the
 * server page can prefetch the first page with an input matching the client's
 * first render — importing it from a `"use client"` module would yield a client
 * reference instead of the value.
 */
export const ADMIN_REPORTS_PAGE_SIZE = 20;
