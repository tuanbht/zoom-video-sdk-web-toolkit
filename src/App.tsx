// @ts-nocheck
import { useEffect, useContext, useState, useCallback, useReducer, useMemo } from 'react';
import ZoomVideo, { ConnectionState, ReconnectReason } from '@zoom/videosdk';
import { message, Modal } from 'antd';
import 'antd/dist/antd.min.css';
import produce from 'immer';
import Video from './feature/video/video';
import VideoSingle from './feature/video/video-single';
import VideoNonSAB from './feature/video/video-non-sab';
import ZoomContext from './context/zoom-context';
import ZoomMediaContext from './context/media-context';
import LoadingLayer from './component/loading-layer';
import { MediaStream } from './index-types';
import './App.css';
import AxiosClient from './config/api-client';
import { buildCallsDashboardPath } from './constants/route-paths';
import { buildApiJoinSession } from './constants/api-paths';
import get from 'lodash/get';
import { isEmpty } from 'lodash';
import { useJoinSessionParams } from './utils/util';

interface AppProps {
  meetingArgs: {
    sdkKey: string;
    topic: string;
    signature: string;
    name: string;
    password?: string;
    webEndpoint?: string;
    enforceGalleryView?: string;
    customerJoinId?: string;
    lang?: string;
  };
}
const mediaShape = {
  audio: {
    encode: false,
    decode: false
  },
  video: {
    encode: false,
    decode: false
  },
  share: {
    encode: false,
    decode: false
  }
};
const mediaReducer = produce((draft, action) => {
  switch (action.type) {
    case 'audio-encode': {
      draft.audio.encode = action.payload;
      break;
    }
    case 'audio-decode': {
      draft.audio.decode = action.payload;
      break;
    }
    case 'video-encode': {
      draft.video.encode = action.payload;
      break;
    }
    case 'video-decode': {
      draft.video.decode = action.payload;
      break;
    }
    case 'share-encode': {
      draft.share.encode = action.payload;
      break;
    }
    case 'share-decode': {
      draft.share.decode = action.payload;
      break;
    }
    case 'reset-media': {
      Object.assign(draft, { ...mediaShape });
      break;
    }
    default:
      break;
  }
}, mediaShape);

declare global {
  interface Window {
    webEndpoint: string | undefined;
    zmClient: any | undefined;
    mediaStream: any | undefined;
    crossOriginIsolated: boolean;
    ltClient: any | undefined;
  }
}

function App(props: AppProps) {
  const { siteSlug, callRequestSlug } = useJoinSessionParams();

  const [loading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('');
  const [isFailover, setIsFailover] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('closed');
  const [mediaState, dispatch] = useReducer(mediaReducer, mediaShape);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSupportGalleryView, setIsSupportGalleryView] = useState<boolean>(true);
  const [session, setSession] = useState({});

  const zmClient = useContext(ZoomContext);

  const mediaContext = useMemo(() => ({ ...mediaState, mediaStream }), [mediaState, mediaStream]);
  const galleryViewWithoutSAB = !window.crossOriginIsolated;

  useEffect(() => {
    if (callRequestSlug && siteSlug) {
      AxiosClient.get(buildApiJoinSession(siteSlug, callRequestSlug))
        .then((response) => setSession(response.data))
        .catch((error) => {
          window.alert(get(error, 'response.data.message', error.message));
          window.location.assign(buildCallsDashboardPath(siteSlug));
        });
    }
  }, [callRequestSlug, siteSlug]);

  useEffect(() => {
    if (!isEmpty(session)) {
      const init = async () => {
        await zmClient.init('en-US', 'Global', {
          enforceMultipleVideos: galleryViewWithoutSAB,
          enforceVirtualBackground: galleryViewWithoutSAB,
          stayAwake: true
        });
        try {
          setLoadingText('Joining the session...');
          await zmClient
            .join(callRequestSlug, session.sessionToken, session.username, `cr_${session.id}`)
            .catch((e) => {
              message.error(e.reason);
            });
          const stream = zmClient.getMediaStream();
          setMediaStream(stream);
          setIsSupportGalleryView(stream.isSupportMultipleVideos());
          setIsLoading(false);
        } catch (e: any) {
          setIsLoading(false);
          message.error(e.reason);
        }
      };
      init();
      return () => {
        ZoomVideo.destroyClient();
      };
    }
  }, [zmClient, galleryViewWithoutSAB, session, callRequestSlug]);

  const onConnectionChange = useCallback(
    (payload) => {
      if (payload.state === ConnectionState.Reconnecting) {
        setIsLoading(true);
        setIsFailover(true);
        setStatus('connecting');
        const { reason, subsessionName } = payload;
        if (reason === ReconnectReason.Failover) {
          setLoadingText('Session Disconnected,Try to reconnect');
        } else if (reason === ReconnectReason.JoinSubsession || reason === ReconnectReason.MoveToSubsession) {
          setLoadingText(`Joining ${subsessionName}...`);
        } else if (reason === ReconnectReason.BackToMainSession) {
          setLoadingText('Returning to Main Session...');
        }
      } else if (payload.state === ConnectionState.Connected) {
        setStatus('connected');
        if (isFailover) {
          setIsLoading(false);
        }
        window.zmClient = zmClient;
        window.mediaStream = zmClient.getMediaStream();
      } else if (payload.state === ConnectionState.Closed) {
        setStatus('closed');
        dispatch({ type: 'reset-media' });
        if (payload.reason === 'ended by host') {
          Modal.warning({
            title: 'Meeting ended',
            content: 'This meeting has been ended by host'
          });
        }
      }
    },
    [isFailover, zmClient]
  );

  const onMediaSDKChange = useCallback((payload) => {
    const { action, type, result } = payload;
    dispatch({ type: `${type}-${action}`, payload: result === 'success' });
  }, []);

  const onDialoutChange = useCallback((payload) => {
    console.log('onDialoutChange', payload);
  }, []);

  const onAudioMerged = useCallback((payload) => {
    console.log('onAudioMerged', payload);
  }, []);

  const onLeaveSession = useCallback(async () => {
    if (status === 'connected') {
      await zmClient.leave();
      message.warn('You have left the session.');
    }
  }, [zmClient, status]);

  useEffect(() => {
    zmClient.on('connection-change', onConnectionChange);
    zmClient.on('media-sdk-change', onMediaSDKChange);
    zmClient.on('dialout-state-change', onDialoutChange);
    zmClient.on('merged-audio', onAudioMerged);
    return () => {
      zmClient.off('connection-change', onConnectionChange);
      zmClient.off('media-sdk-change', onMediaSDKChange);
      zmClient.off('dialout-state-change', onDialoutChange);
      zmClient.off('merged-audio', onAudioMerged);
    };
  }, [zmClient, onConnectionChange, onMediaSDKChange, onDialoutChange, onAudioMerged]);

  return (
    <div className="App">
      {loading && <LoadingLayer content={loadingText} />}
      {!loading && (
        <ZoomMediaContext.Provider value={mediaContext}>
          {isSupportGalleryView ? <Video /> : galleryViewWithoutSAB ? <VideoNonSAB /> : <VideoSingle />}
        </ZoomMediaContext.Provider>
      )}
    </div>
  );
}

export default App;
