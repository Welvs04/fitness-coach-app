import { createVertex } from '@ai-sdk/google-vertex';

// Shared Vertex provider. Project + credentials come from env vars
// (GOOGLE_VERTEX_PROJECT, GOOGLE_APPLICATION_CREDENTIALS / GOOGLE_CLIENT_EMAIL etc.).
export const vertex = createVertex({ location: 'europe-west1' });
// Created per request so builds don't need Vertex env vars.
export const getModel = () => vertex('gemini-2.5-flash');

export const INTAKE_MARKER = 'INTAKE_COMPLETE::';
