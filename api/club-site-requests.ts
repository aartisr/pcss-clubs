import { clubSiteRequestHandler } from '../src/server/clubSiteRequests.js';

export const POST = (request: Request) => clubSiteRequestHandler(request);
export const GET = (request: Request) => clubSiteRequestHandler(request);
