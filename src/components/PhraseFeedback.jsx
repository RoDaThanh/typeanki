import React, { useEffect, useRef, useCallback } from "react";


const getClassNames = (typedChar, currentPhraseChar, isCursorPosition) => {
  let base = "transition-colors duration-75 inline-block";

  // Cursor Styling 
  if (isCursorPosition) {
    base += " border-l-2 border-blue-500  pr-[1px]"; 
  } else {
    base += " border-l-2 border-transparent pr-[1px]";
  }

  // Color Feedback 
  if (typedChar === undefined) {
    return `${base} text-gray-500`;
  }

  // Typed character (green/red feedback)
  return typedChar === currentPhraseChar
    ? `${base} text-green-600` 
    : `${base} text-red-500 bg-red-200/50`;
};

/**
 * Renders and manages the visual state of the typing phrase 
 */
const PhraseFeedback = React.memo(({ currentPhrase, typedText }) => {
  const containerRef = useRef(null);
  const charSpansRef = useRef([]);
  const prevLengthRef = useRef(0);

  // Initial DOM Setup 
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    charSpansRef.current = [];

    // Create spans for each character
    for (let i = 0; i < currentPhrase.length; i++) {
      const span = document.createElement("span");
      span.textContent = currentPhrase[i] === ' ' ? '\u00A0' : currentPhrase[i];
      span.dataset.charindex = i;
      // Initial state
      span.className = getClassNames(undefined, currentPhrase[i], i === 0);
      charSpansRef.current.push(span);
      container.appendChild(span);
    }   
  }, [currentPhrase]);

  // Keystroke handler
  useEffect(() => {
    const spans = charSpansRef.current;
    const len = typedText.length;
    const prevLength = prevLengthRef.current;
    const phraseLength = currentPhrase.length;

    // Compute where the cursor should be
    const cursorIndex = Math.min(len, phraseLength); 

    for (let i = cursorIndex - 1; i <= cursorIndex + 1; i++) {
      if (i < 0 || i >= spans.length) continue;

      const span = spans[i];
      const isCurrentPosition = i === cursorIndex;
      const typedChar = i < typedText.length ? typedText[i] : undefined;
      const expectedChar = i < phraseLength ? currentPhrase[i] : undefined;

      span.className = getClassNames(typedChar, expectedChar, isCurrentPosition);
    }
    prevLengthRef.current = len;
  }, [typedText, currentPhrase]);

  return (
    <div
      ref={containerRef}
      className="relative text-3xl font-mono mb-4 min-h-[4rem] inline-block select-none leading-[1.3] p-1 focus:outline-none"
      style={{ letterSpacing: "0.02em", lineHeight: "1.3em" }}
    ></div>
  );
});

export default PhraseFeedback;