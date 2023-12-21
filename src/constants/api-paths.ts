import { generatePath } from 'react-router-dom';

export const API_JOIN_SESSION = '/sites/:siteSlug/sessions/:callRequestSlug';

export const buildApiJoinSession = (siteSlug: string, callRequestSlug: string) =>
  generatePath(API_JOIN_SESSION, { siteSlug, callRequestSlug });
