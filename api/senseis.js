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
    _id:    doc._id.toString(),
    name:   doc.name || doc['Sensei'] || doc['sensei'] || '',
    status: normalizeStatus(doc.status),
});

module.exports = async function(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
        const db  = await getDb();
        const col = db.collection('senseiList');

        if (req.method === 'GET') {
            const docs = await col.find({}).sort({ name: 1 }).toArray();
            return res.json(docs.map(serial));
        }

        if (req.method === 'POST') {
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'name required' });
            const doc = { name, status: 'Active' };
            const r = await col.insertOne(doc);
            return res.json(serial({ _id: r.insertedId, ...doc }));
        }

        if (req.method === 'PUT') {
            const { _id, ...rest } = req.body;
            if (!_id) return res.status(400).json({ error: '_id required' });
            await col.updateOne({ _id: new ObjectId(_id) }, { $set: rest });
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
