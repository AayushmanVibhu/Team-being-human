const rides={
  'basketball-tonight':{id:'ride-1',pickup:'University Services Building',departure:'5:35 PM',walk:'6 min walk',seats:2},
  'sunset-walk':{id:'ride-2',pickup:'Memorial Union north entrance',departure:'5:55 PM',walk:'4 min walk',seats:3},
  'volunteer-saturday':{id:'ride-3',pickup:'Apache Blvd light rail stop',departure:'8:25 AM',walk:'8 min walk',seats:2}
};
export const carpoolService={getForEvent(id){return rides[id]||null},request(id){return{rideId:id,status:'requested'}},cancel(id){return{rideId:id,status:'available'}}};
