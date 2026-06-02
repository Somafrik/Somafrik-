class CommunicationService {
  constructor({ notifications = [] }) {
    this.notifications = notifications;
  }

  getUnreadCount(notifications) {
    return notifications.filter((notification) => notification.status === "Non lu").length;
  }

  enrichNotifications(notifications) {
    return notifications.map((notification) => ({
      priority: "Moyenne",
      channels: ["Web", "Tablette", "Mobile"],
      attachmentUrl: "",
      sentAt: notification.date,
      audit: [
        {
          action: "Création",
          actorId: notification.createdBy ?? "Système",
          date: notification.createdAt ?? notification.date,
        },
        {
          action: "Envoi",
          actorId: notification.createdBy ?? "Système",
          date: notification.sentAt ?? notification.date,
        },
      ],
      ...notification,
    }));
  }

  filterByAudience(audience, countryCode) {
    const notifications = this.notifications.filter((notification) => {
      if (audience === "Super Administrateur SchoolLink") {
        return notification.audience === audience;
      }

      return notification.audience === audience && notification.countryCode === countryCode;
    });

    return this.enrichNotifications(notifications);
  }
}

module.exports = { CommunicationService };
