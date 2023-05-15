import { User as UserModel } from '@prisma/client';

export interface UserDto extends UserModel {}

export interface SecurityUserDto extends Omit<UserDto, 'password'> {}

export interface CreateUserDto extends Omit<UserDto, 'id'> {}
