# noti Service Abstract
Noti holds the in-app notification list on the client: the messages the app shows, an unread count, and dismissal.

## Rules
- Notifications live only in the client store; the server side declares nothing yet, so a reload starts empty.
- `unreadCount` counts additions since the last `markAllRead()`, not the list's length — removing a notification
  does not lower it.
