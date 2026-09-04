import { getJson, setJson } from './db';
import bcrypt from 'bcryptjs';

export interface AppUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'viewer';
  mustChangePassword: boolean;
  createdAt: string;
}

const USERS_KEY = 'cwt:users';

// We expose these functions for use by auth and API routes
export async function getUsers(): Promise<AppUser[]> {
  return (await getJson(USERS_KEY)) || [];
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'viewer' = 'viewer',
  mustChangePassword = true
): Promise<AppUser> {
  const users = await getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Utente già esistente con questa email');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user: AppUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    role,
    mustChangePassword,
    createdAt: new Date().toISOString(),
  };
  await setJson(USERS_KEY, [...users, user]);
  return user;
}

export async function updateUserPassword(
  email: string,
  newPassword: string
): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  users[idx].passwordHash = await bcrypt.hash(newPassword, 10);
  users[idx].mustChangePassword = false;
  await setJson(USERS_KEY, users);
  return true;
}

export async function resetUserPassword(
  email: string,
  tempPassword: string
): Promise<boolean> {
  const users = await getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  users[idx].passwordHash = await bcrypt.hash(tempPassword, 10);
  users[idx].mustChangePassword = true;
  await setJson(USERS_KEY, users);
  return true;
}

export async function deleteUser(email: string): Promise<boolean> {
  const users = await getUsers();
  const filtered = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  if (filtered.length === users.length) return false;
  await setJson(USERS_KEY, filtered);
  return true;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
