import { useState, useEffect, useRef, useCallback } from 'react';
import { getFps, getFrameCount } from './SpriteMap';

export function useAvatarState(initialState = 'idle') {
  const [state, setState] = useState(initialState);
  const [frame, setFrame] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);
    setFrame(0);
    const fps = getFps(state);
    timerRef.current = setInterval(() => {
      setFrame(f => (f + 1) % getFrameCount(state));
    }, 1000 / fps);
    return () => clearInterval(timerRef.current);
  }, [state]);

  const playOnce = useCallback((newState, thenState = 'idle') => {
    setState(newState);
    const duration = (getFrameCount(newState) / getFps(newState)) * 1000;
    setTimeout(() => setState(thenState), duration);
  }, []);

  return { state, frame, setState, playOnce };
}
