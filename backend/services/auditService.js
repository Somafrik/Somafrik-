class AuditService {
  constructor(repository) {
    this.repository = repository;
  }

  async record(req, action, entityType, entityId, newValue = {}) {
    const principal = req.principal ?? {};
    await this.repository.recordAudit({
      schoolCode: principal.schoolCode,
      userId: principal.sub,
      action,
      entityType,
      entityId,
      newValue,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  }
}

module.exports = { AuditService };
