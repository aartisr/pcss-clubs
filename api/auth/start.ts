import { authHandler } from '../../src/server/auth.js';
export const GET = (request: Request) => authHandler(request, 'start');
