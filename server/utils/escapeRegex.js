/**
 * Escape user-supplied text so it can be safely embedded in a RegExp / $regex query.
 * Prevents regex injection and ReDoS via crafted patterns.
 */
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
