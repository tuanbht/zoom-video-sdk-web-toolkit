import { generatePath } from 'react-router-dom';

export const JOIN_SESSION_PATH = '/:siteSlug/sessions/:callRequestSlug/join';
export const CALLS_DASHBOARD_PATH = '/:siteSlug/calls';

export const buildCallsDashboardPath = (siteSlug: string) =>
  siteSlug ? generatePath(CALLS_DASHBOARD_PATH, { siteSlug }) : '/';
