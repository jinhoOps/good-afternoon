import './styles.css';
import { loadState, saveState } from './domain/state';
import { wireEvents } from './view/events';
import { queryAppElements, renderApp } from './view/render';

const elements = queryAppElements();
const initialState = loadState(window.localStorage);

saveState(window.localStorage, initialState);
renderApp(elements, initialState);
wireEvents(elements, initialState, window.localStorage);
