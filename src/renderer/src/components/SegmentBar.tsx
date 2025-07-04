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


    return (
        <div>
            {segments.map((seg, index) => {
                const leftPercent = seg.from * 100;
                const widthPercent = (seg.to - seg.from) * 100;

                const isLast = index === segments.length - 1;

                return (
                <button
                    key={index}
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
    );
}

createRoot(document.getElementById('overlay-segment-bar')!).render(
  <StrictMode>
    <SegmentBar />
  </StrictMode>
)
