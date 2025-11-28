declare global {
  interface StringConstructor
  {
    isNullOrEmpty(str: string): boolean;
    isNullOrWhitespace(str: string): boolean;
  }
  interface String {
    contains(str: string): boolean;
  }
}

String.isNullOrEmpty = function(s: string) {
  return s == null || s === "";
};

String.isNullOrWhitespace = function(input: string) 
{
  return !input || input.trim().length === 0;
}

String.prototype.contains = function(this: string, s: string): boolean {
  return this.indexOf(s) >= 0;
}

export {};
