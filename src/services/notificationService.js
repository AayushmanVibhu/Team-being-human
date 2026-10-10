// Local prototype boundary for future Web Push and geofenced activity alerts.
export const notificationService={
  async setEnabled(enabled){return{enabled,simulated:true}},
  async setQuietHours(quietHours){return{quietHours,simulated:true}},
  async getNearbyPosition(){return{latitude:33.4242,longitude:-111.9281,accuracy:'simulated campus area'}}
};
