const https = require('https');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a buffer as an *authenticated* raw asset. Authenticated assets cannot
 * be fetched from their plain URL; every read must go through a signed URL.
 */
const uploadBuffer = (buffer, { folder, publicId }) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: publicId, resource_type: 'raw', type: 'authenticated' },
            (err, result) => {
                if (err) return reject(err);
                // Cloudinary returns a signed (non-expiring) URL; strip the signature so the
                // stored path is useless without a fresh short-lived signature from getSignedUrl().
                result.secure_url = result.secure_url.replace(/\/s--[^/]+--\//, '/');
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });

/**
 * Short-lived signed URL for an evidence record. Falls back to the stored
 * public URL for legacy records that were uploaded without authentication.
 */
const getSignedUrl = (evidence, ttlSeconds = 300) => {
    if (!evidence.storagePublicId) return evidence.filePath;
    return cloudinary.url(evidence.storagePublicId, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + ttlSeconds
    });
};

const deleteAsset = async (evidence) => {
    if (!evidence.storagePublicId) return;
    try {
        await cloudinary.uploader.destroy(evidence.storagePublicId, { resource_type: 'raw', type: 'authenticated' });
    } catch (err) {
        console.error(`Failed to delete storage asset ${evidence.storagePublicId}:`, err.message);
    }
};

/** Fetch a remote file into a Buffer (null on any failure). */
const fetchBuffer = (url) =>
    new Promise((resolve) => {
        if (!url || !url.startsWith('http')) return resolve(null);
        https.get(url, (res) => {
            if (res.statusCode !== 200) { res.resume(); return resolve(null); }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', () => resolve(null));
    });

/** Stream a remote file and return its SHA-256 (null when download fails). */
const hashRemote = (url) =>
    new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) { res.resume(); return resolve(null); }
            const hash = crypto.createHash('sha256');
            res.on('data', (c) => hash.update(c));
            res.on('end', () => resolve(hash.digest('hex')));
            res.on('error', () => resolve(null));
        }).on('error', () => resolve(null));
    });

/** Sanitize an uploaded filename for use in a storage public id. */
const safeFileName = (name = 'file') =>
    name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 120) || 'file';

module.exports = { uploadBuffer, getSignedUrl, deleteAsset, fetchBuffer, hashRemote, safeFileName };
