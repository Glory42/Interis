export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
// Lets password managers generate a password the API will accept.
export const PASSWORD_RULES = { passwordrules: `minlength: ${PASSWORD_MIN}; maxlength: ${PASSWORD_MAX};` };
