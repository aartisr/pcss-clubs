import { authHandler } from '../../src/server/auth.js';
export const POST = (request: Request) => authHandler(request, 'logout');
