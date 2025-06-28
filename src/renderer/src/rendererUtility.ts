



export function getPopupPositionBelow(window: Window, rect: DOMRect, offset?: { x: number, y: number }) : { x: number, y: number }
{
  let popupX = window.screenX + rect.left;
  let popupY = window.screenY + rect.top + rect.height + 5; // default offset

  if (offset) {
    popupX += offset.x;
    popupY += offset.y;
  }

  return {
    x: popupX,
    y: popupY
  }
}


/**
 * How to Info Popup (currently):
 * 
 * do this somewhere:
 * 
 *  const pos = getPopupPositionBelow(window, buttonRef.current!.getBoundingClientRect());
    window.backend.showInfoPopup({
        x: pos.x,
        y: pos.y,
        header: "Hello",
        body: "This is the first popup",
        isError: false
    });

    you need a button ref, which you get through reacts useRef:
    const buttonRef = useRef<HTMLButtonElement>(null);

    and in the button itself:
    button ref={buttonRef}
 */