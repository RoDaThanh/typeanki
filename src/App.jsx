import React, {
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import './App.css';
import { generateWords } from './utils/wordGenerator';
import { normalizeText, removeSpace }  from './utils/normalizeText';
import PhraseFeedback from './components/PhraseFeedback';

const initialState = {
  inputText: '',
  phrases: [],
  currentIndex: 0,
  typedText: '',
  mode: 'paste',
  startTime: null,
  endTime: null,
  errors: 0,
};

function typingReducer(state, action) {
  switch (action.type) {
    case 'START_TYPING':
      return {
        ...state,
        phrases: action.payload.phrases,
        mode: 'typing',
        currentIndex: 0,
        typedText: '',
        startTime: null,
        endTime: null,
        errors: 0,
      };

    case 'TYPE_CHAR':
      {
        const currentPhrase = state.phrases[state.currentIndex];
        const key = action.payload.key;

        let newText = state.typedText;
        let newErrors = state.errors;
        let isPhraseComplete = false;

        // --- Core Typing Logic ---
        if (key === 'Backspace') {
          newText = newText.slice(0, -1);
        } else if (key.length === 1) {
          // Only allow typing up to the phrase length 
          if (newText.length < currentPhrase.length) {
            newText += key;
            // Check for error on the new character
            if (key !== currentPhrase[newText.length - 1]) {
              newErrors++;
            }
          }
        }

        // Check for IMMEDIATE completion
        if (newText.length === currentPhrase.length) {
          isPhraseComplete = true;
        }

        // --- State Transition Logic ---
        if (isPhraseComplete) {
          if (state.currentIndex === state.phrases.length - 1) {
            // All phrases complete -> END_TYPING
            return {
              ...initialState,
              mode: 'results',
              endTime: Date.now(),
              startTime: state.startTime,
              phrases: state.phrases,
              errors: newErrors,
            };
          } else {
            // Phrase complete, but not the last one.
            // We return the completed state here, and use a SEPARATE effect (PHRASE_NEXT)
            // to trigger the 300ms delay and transition.
            return {
              ...state,
              typedText: newText, // Keep text for a moment
              errors: newErrors,
              startTime: state.startTime || Date.now(),
              // We set a flag to signal the effect to run
              _phraseCompleted: true,
            };
          }
        }

        // Default: Typing continues
        return {
          ...state,
          typedText: newText,
          errors: newErrors,
          startTime: state.startTime || Date.now(),
          _phraseCompleted: false,
        };
      }

    case 'PHRASE_NEXT': 
      return {
        ...state,
        typedText: '',
        currentIndex: (state.currentIndex + 1) % state.phrases.length,
        _phraseCompleted: false,
      };

    case 'END_TYPING':
      return {
        ...initialState,
        mode: 'results',
        endTime: Date.now(),
        startTime: state.startTime,
        phrases: state.phrases,
        errors: state.errors,
      };

    case 'RESET':
      return { ...initialState, phrases: state.phrases };
    case 'SET_PHRASES':
      return { ...state, phrases: action.payload };
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    default:
      throw new Error('Unknown action');
  }
}

function useTypingTest() {
  // Add _phraseCompleted to initial state to track transition status
  const [state, dispatch] = useReducer(typingReducer, { ...initialState, _phraseCompleted: false });

  // Load/Save phrases effects remain unchanged
  useEffect(() => {
    try {
      const saved = localStorage.getItem('typeanki_phrases');
      if (saved) dispatch({ type: 'SET_PHRASES', payload: JSON.parse(saved) });
    } catch (e) {
      console.error('Failed to load phrases', e);
    }
  }, []);

  // Save phrases
  useEffect(() => {
    if (state.phrases.length > 0) {
      try {
        localStorage.setItem('typeanki_phrases', JSON.stringify(state.phrases));
      } catch (e) {
        console.error('Failed to save phrases', e);
      }
    }
  }, [state.phrases]);

  const startTyping = useCallback(() => {
    const removedSpaceText = removeSpace(state.inputText);

    const lines = removedSpaceText
      .split('\n')
      .map((l) => normalizeText(l))
      .filter(Boolean);
    if (lines.length > 0) {
      dispatch({ type: 'START_TYPING', payload: { phrases: lines } });
    }
  }, [state.inputText]);

  useEffect(() => {
    if (state.mode !== 'typing' || !state._phraseCompleted) return;

    // Phrase is complete, wait 300ms before moving to the next one
    const timer = setTimeout(() => {
      dispatch({ type: 'PHRASE_NEXT' });
    }, 300);

    return () => clearTimeout(timer);
    // Depends ONLY on the flag set by the reducer, ensuring the effect only runs ONCE per completion.
  }, [state._phraseCompleted, state.mode, dispatch]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, startTyping, reset, dispatch };
}

function ResultsScreen({ state, reset }) {
  const durationInMinutes = (state.endTime - state.startTime) / 1000 / 60;
  const typedChars = state.phrases.join('').length;
  const wordCount = state.phrases.join(' ').split(' ').length;
  const wpm = Math.round(wordCount / durationInMinutes);
  const accuracy = Math.round(((typedChars - state.errors) / typedChars) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Results</h1>
      <p className="text-xl mb-2">
        WPM: <span className="font-bold text-green-600">{wpm}</span>
      </p>
      <p className="text-xl mb-4">
        Accuracy: <span className="font-bold text-green-600">{accuracy}%</span>
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  );
}

// ---------------- MAIN APP ----------------
export default function App() {
  const { state, startTyping, reset, dispatch } = useTypingTest();
  const currentPhrase = state.phrases[state.currentIndex] || '';
  const typingContainerRef = useRef(null);

  // Auto-focus the typing div when mode=typing
  useEffect(() => {
    if (state.mode === 'typing' && typingContainerRef.current) {
      typingContainerRef.current.focus();
    }
  }, [state.mode, state.currentIndex]);

  const setInputText = useCallback(
    (e) => dispatch({ type: 'SET_INPUT_TEXT', payload: e.target.value }),
    [dispatch]
  );

  if (state.mode === 'paste') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">TypeAnki Starter</h1>
        <textarea
          value={state.inputText}
          onChange={setInputText}
          placeholder="Paste your phrases here, one per line..."
          className="w-full max-w-lg h-60 p-3 border rounded-xl shadow mb-4 focus:outline-none"
        />
        <button
          onClick={startTyping}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
        >
          Begin
        </button>
        <div className="mt-4">
          <button
            onClick={() =>
              dispatch({
                type: 'START_TYPING',
                payload: { phrases: generateWords(30) },
              })
            }
            className="text-sm text-blue-600 underline"
          >
            Or start with 30 random words
          </button>
        </div>
      </div>
    );
  }

  if (state.mode === 'results') {
    return <ResultsScreen state={state} reset={reset} />;
  }

  return (
    <div
      ref={typingContainerRef}
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (state.mode !== 'typing') return;
        if (e.key === 'Backspace' || e.key === ' ' || e.key.length === 1) {
          e.preventDefault();
        }
        if (e.key === 'Backspace' || e.key.length === 1) {
          dispatch({ type: 'TYPE_CHAR', payload: { key: e.key } });
        }
      }}
    >
      <h2 className="text-xl font-semibold mb-3">
        Phrase {state.currentIndex + 1} / {state.phrases.length}
      </h2>
      <PhraseFeedback currentPhrase={currentPhrase} typedText={state.typedText} />
      <p className="text-gray-400 mt-2">(Just start typing — no input box!)</p>
      <button
        onClick={reset}
        className="mt-6 text-sm text-blue-600 underline"
      >
        Reset
      </button>
    </div>
  );
}
