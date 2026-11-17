export class Notifications {
  static registerRemoteNotifications(){}
  static events(){return{
    registerRemoteNotificationsRegistered:cb=>({remove:()=>{}}),
    registerRemoteNotificationsRegistrationFailed:cb=>({remove:()=>{}}),
    registerNotificationReceivedForeground:cb=>({remove:()=>{}}),
    registerNotificationReceivedBackground:cb=>({remove:()=>{}}),
    registerNotificationOpened:cb=>({remove:()=>{}}),
  }}
  static postLocalNotification(){}
  static getInitialNotification(){return Promise.resolve(null)}
  static setNotificationChannel(){}
  // there are no delivered notifications on web
  static removeAllDeliveredNotifications(){}
  static removeDeliveredNotifications(){}
  static cancelLocalNotification(){}
  static ios = {
    checkPermissions: async()=>({}),
    getBadgeCount: async()=>0,
    setBadgeCount(){},
    getDeliveredNotifications: async()=>[],
    removeDeliveredNotifications(){},
    removeAllDeliveredNotifications(){},
  };
}
export class Notification {}
export const NotificationBackgroundFetchResult = {NEW_DATA:'newData',NO_DATA:'noData',FAILED:'failed'};
export const NotificationCompletion = {ALERT:'alert',SOUND:'sound',BADGE:'badge'};
