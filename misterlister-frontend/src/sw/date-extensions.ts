export {};

declare global {
  interface Date
  {
    addDays(days: number): Date;
    addHours(days: number): Date;
    addMinutes(minutes: number): Date;
  }
}

const msInMinute = 60000;
const msInHour = msInMinute * 60;
const msInDay = msInHour * 24;

Date.prototype.addMinutes =  function(minutes) {
  return new Date(this.getTime() + minutes * msInMinute);
};
Date.prototype.addHours =  function(hours) {
  return new Date(this.getTime() + hours * msInHour);
};

Date.prototype.addDays =  function(days) {
  let result = new Date(this.getTime());

  // Set the time to noon to avoid DST issues as time changes occur at midnight
  result.setHours(12);

  // Add the days
  result.setDate(result.getDate() + days);

  // Reset the time to the original input's time
  result.setHours(this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());

  return result;
};

