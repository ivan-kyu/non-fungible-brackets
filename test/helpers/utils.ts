export const incorrectParam = (param: string) =>
  `${param} was not set correctly!`;

export const getEqArrTokensToMint = (length: number, tokensToMint: string) =>
  Array.from({ length }, () => tokensToMint);
