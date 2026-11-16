const now = () => new Date().toISOString();

function recordBackupRestoreCompleted(db, requestedBy, backup) {
  const restoredActor = db.prepare('SELECT id, active FROM users WHERE id = ?').get(requestedBy.userId);
  const restoredActorPresent = Boolean(restoredActor && restoredActor.active === 1);
  const details = {
    fileName: backup.fileName,
    sha256: backup.sha256,
    requestedByUserId: requestedBy.userId,
    requestedByUsername: requestedBy.username,
    restoredActorPresent,
  };
  db.transaction(() => {
    db.prepare(`
      INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, 'backup_restore_completed', 'database', NULL, ?, ?)
    `).run(restoredActorPresent ? requestedBy.userId : null, JSON.stringify(details), now());
  })();
  return restoredActorPresent;
}

function recordAttachmentExported(db, actorId, attachment, exportedFileName, sha256) {
  const details = {
    attachmentId: attachment.id,
    originalName: attachment.original_name,
    exportedFileName,
    sha256,
  };
  db.transaction(() => {
    db.prepare(`
      INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, 'attachment_exported', ?, ?, ?, ?)
    `).run(actorId, attachment.entity_type, attachment.entity_id, JSON.stringify(details), now());
  })();
}

module.exports = { recordBackupRestoreCompleted, recordAttachmentExported };
