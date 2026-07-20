import * as migration_20260712_220559_init from './20260712_220559_init';

export const migrations = [
  {
    up: migration_20260712_220559_init.up,
    down: migration_20260712_220559_init.down,
    name: '20260712_220559_init'
  },
];
