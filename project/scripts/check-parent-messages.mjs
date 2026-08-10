import fs from 'node:fs';

const source = fs.readFileSync('src/pages/dashboard/shared/Messages.tsx', 'utf8');
const directory = fs.readFileSync('src/services/messageDirectoryService.ts', 'utf8');
for (const forbidden of ['ensureParentSchoolChats', '/group-members/user/', '/users/?skip']) {
  if (source.includes(forbidden) || directory.includes(forbidden)) {
    throw new Error(`Forbidden parent message flow remains: ${forbidden}`);
  }
}
if (!/getChats\(\s*currentUserId\s*\)/.test(source)) throw new Error('Messages must load chats through scoped backend contract');
console.log('parent messages integration check passed');
