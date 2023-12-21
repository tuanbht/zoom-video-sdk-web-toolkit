import { useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { JOIN_SESSION_PATH } from '../constants/route-paths';

export function isShallowEqual(objA: any, objB: any) {
  if (objA === objB) {
    return true;
  }

  if (!objA || !objB) {
    return false;
  }

  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  const len = aKeys.length;

  if (bKeys.length !== len) {
    return false;
  }

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < len; i++) {
    const key = aKeys[i];

    if (objA[key] !== objB[key] || !Object.hasOwn(objB, key)) {
      return false;
    }
  }

  return true;
}

export const useJoinSessionParams = () =>
  useMemo(() => {
    const match = matchPath(window.location.pathname, { path: JOIN_SESSION_PATH, exact: true, strict: true });

    return match && match.params ? match.params : { siteSlug: '', callRequestSlug: '' };
  }, []);
