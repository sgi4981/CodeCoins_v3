const { ObjectId } = require('mongodb');
const { getDb } = require('./_db');

const cors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const serial = doc => ({ ...doc, _id: doc._id.toString() });

module.exports = async function(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
        const db  = await getDb();
        const col = db.collection('codeCoinsData');

        if (req.method === 'GET') {
            const docs = await col.find({}).sort({ _id: -1 }).toArray();
            return res.json(docs.map(serial));
        }

        if (req.method === 'POST') {
            const { _id, ...doc } = req.body;
            const r = await col.insertOne(doc);
            return res.json(serial({ _id: r.insertedId, ...doc }));
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
