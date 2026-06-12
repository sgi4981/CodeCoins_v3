const { ObjectId } = require('mongodb');
const { getDb } = require('./_db');

const cors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const normalizeStatus = raw => {
    const s = (raw || '').toString().trim().toLowerCase();
    return s === 'inactive' ? 'Inactive' : 'Active';
};

const serial = doc => ({
    _id:       doc._id.toString(),
    fullName:  doc.fullName  || doc['Ninja Full Name'] || doc['ninja full name'] || '',
    shortName: doc.shortName || doc['Ninja']           || doc['ninja']           || '',
    status:    normalizeStatus(doc.status ?? doc['Status']),
});

module.exports = async function(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
        const db  = await getDb();
        const col = db.collection('ninjaList');

        if (req.method === 'GET') {
            const activeOnly = req.query.activeOnly === '1';
            const query = activeOnly
                ? { $nor: [
                    { status: { $regex: /inactive/i } },
                    { Status: { $regex: /inactive/i } },
                  ] }
                : {};
            const docs = await col.find(query).sort({ fullName: 1 }).toArray();
            return res.json(docs.map(serial));
        }

        if (req.method === 'POST') {
            const { fullName, shortName, status } = req.body;
            if (!fullName) return res.status(400).json({ error: 'fullName required' });
            const doc = { fullName, shortName: shortName || '', status: status || 'Active' };
            const r = await col.insertOne(doc);
            return res.json(serial({ _id: r.insertedId, ...doc }));
        }

        if (req.method === 'PUT') {
            const { _id, ...rest } = req.body;
            if (!_id) return res.status(400).json({ error: '_id required' });
            const setFields = { ...rest };
            if (rest.fullName  !== undefined) setFields['Ninja Full Name'] = rest.fullName;
            if (rest.shortName !== undefined) setFields['Ninja']           = rest.shortName;
            if (rest.status    !== undefined) setFields['Status']          = rest.status;
            const result = await col.updateOne({ _id: new ObjectId(_id) }, { $set: setFields });
            if (result.matchedCount === 0) return res.status(404).json({ error: 'Ninja not found' });
            return res.json({ ok: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'id required' });
            await col.deleteOne({ _id: new ObjectId(id) });
            return res.json({ ok: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
