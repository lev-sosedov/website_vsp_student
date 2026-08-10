import fs from 'node:fs';

const source = fs.readFileSync('src/api/chatSocket.ts', 'utf8');
const messages = fs.readFileSync('src/pages/dashboard/shared/Messages.tsx', 'utf8');
const staffService = fs.readFileSync('src/services/schoolStaffDirectoryService.ts', 'utf8');
const userApi = fs.readFileSync('src/api/userApi.ts', 'utf8');

if (!source.includes('vshp.jwt.')) throw new Error('WebSocket auth subprotocol is missing');
if (source.includes("searchParams.set('token'")) throw new Error('JWT must not be placed in WebSocket URL');
if (!source.includes('event.code === 4401') || !source.includes('event.code === 4403')) throw new Error('terminal auth close handling is missing');
if (!source.includes('!this.authenticationRejected')) throw new Error('auth rejection must stop reconnect');
if (!messages.includes('getChatParticipants')) throw new Error('messages must use scoped participant profiles');
if (messages.includes('getUsersByIds(userIds)')) throw new Error('message sender profiles must not use broad user lookup');
if (messages.includes('??????? ? ??????????????')) throw new Error('corrupted system title leaked to frontend');
if (!staffService.includes('getScopedStaff')) throw new Error('staff directory must use scoped staff endpoint');
if (staffService.includes('getUsers(')) throw new Error('staff directory must not use broad users endpoint');
if (!userApi.includes('/api/v1/users/staff/scoped')) throw new Error('scoped staff endpoint is missing');

console.log('chat socket security check passed');
