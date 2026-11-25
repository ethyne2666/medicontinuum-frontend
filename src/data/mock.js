export const IMG = {};

export function avatar(name = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E8EEF9&color=243B64`;
}