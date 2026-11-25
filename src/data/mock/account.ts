// Account mock — the editable profile behind the Account Info page. Mutable session
// store so an edit persists until reload (the real endpoints PUT the user / password).
import { CURRENT_USER } from '@/lib/user';
import type { IAccount } from '@/types';

const [firstName, ...rest] = CURRENT_USER.name.split(' ');
const ACCOUNT: IAccount = {
  firstName: firstName ?? '',
  lastName: rest.join(' '),
  email: CURRENT_USER.email,
};

export const getAccount = (): IAccount => ({ ...ACCOUNT });

export const updateAccount = (input: { firstName: string; lastName: string }): IAccount => {
  ACCOUNT.firstName = input.firstName.trim();
  ACCOUNT.lastName = input.lastName.trim();
  return getAccount();
};

// Password change is a no-op in the mock — it just validates the shape and "succeeds".
export const changePassword = (_input: {
  current: string;
  next: string;
}): { ok: true } => ({ ok: true });
