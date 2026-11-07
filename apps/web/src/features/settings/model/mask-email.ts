// "me@example.com" → "m•@example.com": enough to recognise, not to copy.
export const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return name && domain ? `${name.slice(0, 1)}•@${domain}` : email;
};
