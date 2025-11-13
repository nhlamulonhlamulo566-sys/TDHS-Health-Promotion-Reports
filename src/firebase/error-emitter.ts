
import { EventEmitter } from 'events';

// This is a workaround for the fact that the browser version of 'events' is not a constructor
const MyEventEmitter =
  typeof EventEmitter === 'function' ? EventEmitter : (EventEmitter as any).EventEmitter;

// Create a new event emitter
export const errorEmitter = new MyEventEmitter();
