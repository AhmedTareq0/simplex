import {formatDate} from "@angular/common";

export function FormatDate(date: Date, withTime: boolean = false) {
  let utcOffset: any = new Date().getTimezoneOffset();
  let date_ = new Date(date).setMinutes(new Date(date).getMinutes() + utcOffset);
  if (withTime) {
    let hours = date.getHours() + (utcOffset / 60);
    return formatDate(date_, `yyyy-MM-ddT${hours < 10 ? '0' + hours : hours}:mm:ss`, 'en-US') + 'Z'
  } else {
    return formatDate(date_, `yyyy-MM-ddT${24 + (utcOffset / 60)}:00:00`, 'en-US') + 'Z'
  }
}
