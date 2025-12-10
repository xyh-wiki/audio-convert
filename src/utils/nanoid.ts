const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const nanoid = (length = 10) => {
  let id = "";
  const len = alphabet.length;
  for (let i = 0; i < length; i += 1) {
    id += alphabet[Math.floor(Math.random() * len)];
  }
  return id;
};
