export type NotificationPriority = "Faible" | "Moyenne" | "Haute" | "Critique";
export type NotificationStatus = "Non lu" | "Lu" | "Archivé";

export class NotificationService<T extends { status?: string; priority?: string }> {
  countUnread(notifications: T[]) {
    return notifications.filter((notification) => notification.status === "Non lu").length;
  }

  filterByStatus(notifications: T[], status: NotificationStatus | "Tous") {
    if (status === "Tous") {
      return notifications;
    }

    return notifications.filter((notification) => notification.status === status);
  }

  filterByPriority(notifications: T[], priority: NotificationPriority | "Toutes") {
    if (priority === "Toutes") {
      return notifications;
    }

    return notifications.filter((notification) => notification.priority === priority);
  }
}
