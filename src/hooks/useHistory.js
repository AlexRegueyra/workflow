import { useReducer, useCallback } from 'react';

const initialState = {
    past: [],
    present: null,
    future: []
};

const UNDO = 'UNDO';
const REDO = 'REDO';
const SET = 'SET';
const CLEAR = 'CLEAR';

const reducer = (state, action) => {
    const { past, present, future } = state;

    switch (action.type) {
        case UNDO: {
            if (past.length === 0) return state;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [present, ...future]
            };
        }

        case REDO: {
            if (future.length === 0) return state;

            const next = future[0];
            const newFuture = future.slice(1);

            return {
                past: [...past, present],
                present: next,
                future: newFuture
            };
        }

        case SET: {
            if (present === action.newPresent) return state;

            return {
                past: [...past, present],
                present: action.newPresent,
                future: []
            };
        }

        case CLEAR: {
            return {
                ...initialState,
                present: action.newPresent
            };
        }
    }
};

export const useHistory = (initialPresent) => {
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        present: initialPresent,
    });

    const canUndo = state.past.length !== 0;
    const canRedo = state.future.length !== 0;

    const undo = useCallback(() => {
        if (canUndo) {
            dispatch({ type: UNDO });
        }
    }, [canUndo]);

    const redo = useCallback(() => {
        if (canRedo) {
            dispatch({ type: REDO });
        }
    }, [canRedo]);

    const set = useCallback(newPresent => {
        dispatch({ type: SET, newPresent });
    }, []);

    const clear = useCallback(newPresent => {
        dispatch({ type: CLEAR, newPresent });
    }, []);

    return { state: state.present, set, undo, redo, clear, canUndo, canRedo };
};