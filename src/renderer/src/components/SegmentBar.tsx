import '../assets/main.css'

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Segment = {
  from: number; // i.e. 0.0
  to: number;   // i.e. 0.12
};

function showOutput(msg: string): void {
    window.electron.ipcRenderer.send('display-output', msg);
}

function SegmentBar(): React.JSX.Element {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [lastIndex, setLastIndex] = useState<number | undefined>(undefined);

  // --- Checks: Signed in and Song Playing ---
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [songPlaying, setSongPlaying] = useState<boolean | null>(null);

  useEffect(() => {
    window.electron.ipcRenderer.on('set-sign-in-state', (_: any, state: boolean) => {
      setSignedIn(state);
    });
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.on('set-song-playing', (_: any, state: boolean) => {
      setSongPlaying(state);
    });
  }, []);


  // --- Set Segments ---
  useEffect(() => {
    window.electron.ipcRenderer.on('set-segments', (_: any, newSegments: Segment[]) => {
      const total = newSegments.reduce((sum, seg) => sum + (seg.to - seg.from), 0);
      if (total < 0.95 || total > 1.05) {
        showOutput('Segment sum not within [95%, 105%]: ' + total);
        return;
      }
      setSegments(newSegments);
      showOutput(`Setting ${newSegments.length} segments`);
    });
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.send('resize-segment-window', showPopup);
  }, [showPopup]);


  // --- Button Calls ---
  const handleSegmentSelect = async (index: number) => {
    // if rating is not allowed (i.e. a segment has already been rated), don't show popup
    const allowed = await window.backend.isSegmentRatingAllowed();
    if (!allowed) {
      setLastIndex(undefined);
      setShowPopup(false);
      return;
    }

    // if the same index was selected before, just show and hide the popup
    if (index === lastIndex) {
      setShowPopup(!showPopup);
      setLastIndex(index);
      return;
    }

    // if it's a different index, reposition the popup
    const button = document.querySelectorAll<HTMLButtonElement>('.segment')[index];
    if (button) {
      const rect = button.getBoundingClientRect();
      setPopupPosition({
        left: rect.left + rect.width / 2,
        top: rect.top,
      });
    }
    setShowPopup(true);
    setLastIndex(index);
  }

  const handlePlus = () => {
    if (!lastIndex) {
      showOutput("Error! Cannot rate segment, no index set.");
      return;
    }
    window.backend.rateCurrentSongSegment(1, lastIndex);
  };

  const handleMinus = () => {
    if (!lastIndex) {
      showOutput("Error! Cannot rate segment, no index set.");
      return;
    }
    window.backend.rateCurrentSongSegment(-1, lastIndex);
  };


  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', height: '100%', 
      backgroundColor: 'black',
      borderRadius: '4px'
      }}>
      {signedIn && songPlaying && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '8px',
        }}>
          {segments.map((seg, index) => {
          const leftPercent = seg.from * 100;
          const widthPercent = (seg.to - seg.from) * 100;

          const isLast = index === segments.length - 1;

          return (
            <button
              key={index}
              onClick={() => handleSegmentSelect(index)}
              className='segment'
              style={{
                position: 'absolute',
                left: `calc(${leftPercent}%)`,
                width: isLast
                  ? `${widthPercent}%`
                  : `calc(${widthPercent}% - 3px)`
              }}
            />
          );
        })}
        </div>
      )}
      {showPopup && (
        <div className="song-rate-div" style={{
          position: 'absolute',
          left: popupPosition.left,
          bottom: '8px',
          transform: 'translateX(-50%)',
        }}>
            <button className="song-rate-plus" onClick={handlePlus}>+</button>
            <button className="song-rate-minus" onClick={handleMinus}>-</button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('overlay-segment-bar')!).render(
  <StrictMode>
    <SegmentBar />
  </StrictMode>
)
