/**
 * Admins and analysts may access every case. Investigators may only access
 * cases they created or are assigned to. Returns true when allowed.
 */
const canAccessCase = (user, caseItem) => {
    if (!user || !caseItem) return false;
    if (user.role === 'admin' || user.role === 'analyst') return true;
    const uid = String(user._id || user.id);
    const idOf = (ref) => (ref && ref._id ? String(ref._id) : ref ? String(ref) : null);
    return idOf(caseItem.createdBy) === uid || idOf(caseItem.assignedTo) === uid;
};

/**
 * Express helper: loads the case, enforces access, and either returns the
 * document or writes the appropriate error response and returns null.
 */
const loadCaseForUser = async (Case, req, res, caseId, populate = '') => {
    let query = Case.findById(caseId);
    if (populate) query = query.populate(populate);
    const caseItem = await query;
    if (!caseItem) {
        res.status(404).json({ message: 'Case not found' });
        return null;
    }
    if (!canAccessCase(req.user, caseItem)) {
        res.status(403).json({ message: 'You do not have access to this case' });
        return null;
    }
    return caseItem;
};

module.exports = { canAccessCase, loadCaseForUser };
