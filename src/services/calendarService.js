export const calendarService={
  async connect(){await new Promise(r=>setTimeout(r,400));return{connected:true,provider:'Google Calendar (simulated)'}},
  disconnect(){return{connected:false,provider:null}},
  externalTitle(event,mask=true){return mask?'Busy — personal activity':event.title},
  exportIcs(event){const clean=s=>String(s||'').replace(/[,;]/g,' ');return`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${event.id}@kinlii.local\nSUMMARY:${clean(event.title)}\nLOCATION:${clean(event.publicLocationName||event.location)}\nDESCRIPTION:${clean(event.description)}\nEND:VEVENT\nEND:VCALENDAR`}
};
