export class NotificationMessage {
  //NzNotificationService's parameter
  type: string;
  title: string;
  content: string;
  duration: number;

  constructor(type: string, title: string, content: string) {
    this.type = type;
    this.title = title;
    this.content = content;
    this.duration = 3000;//ms
  }
}
