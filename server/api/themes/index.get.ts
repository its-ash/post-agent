import { THEMES } from '~/server/utils/themes'

export default defineEventHandler(() => {
  return { themes: THEMES }
})